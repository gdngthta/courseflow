import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { sendTelegramMessage } from '@/lib/telegram'
import {
  findReminderCandidates,
  generateReminderMessage,
  type CandidateTaskInput,
} from '@/lib/reminderLogic'
import type {
  ReminderPreferences,
  TaskStatus,
  Difficulty,
} from '@/types'

// Cron must run on Node.js (uses fetch + Supabase service key).
export const runtime = 'nodejs'

// Never cache — every invocation must hit the DB.
export const dynamic = 'force-dynamic'


// ── Row shapes returned by Supabase ─────────────────────────

interface ProfileWithPrefs {
  id: string
  full_name: string | null
  telegram_chat_id: string
  telegram_enabled: boolean
  reminder_preferences: ReminderPreferences | null
}

interface PersonalTaskRow {
  id: string
  user_id: string
  title: string
  status: TaskStatus
  progress: number
  difficulty: Difficulty
  due_date: string
  course: { code: string; name: string } | null
}

interface ProjectTaskRow {
  id: string
  title: string
  status: TaskStatus
  progress: number
  difficulty: Difficulty
  due_date: string
  assigned_to: string | null
  project: { name: string } | null
}


// ── Timezone helper ──────────────────────────────────────────
//
// Uses the built-in Intl API (Node.js 16+, no extra packages).
// Returns the local hour (0–23) for a given IANA timezone.

function getLocalHour(timezone: string, now: Date): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    })
    const parts = formatter.formatToParts(now)
    const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0'
    // Intl may return '24' for midnight in some locales — normalise to 0.
    return parseInt(hourStr, 10) % 24
  } catch {
    // Unknown timezone — fall through and treat as UTC.
    return now.getUTCHours()
  }
}

// ── Send-time match ──────────────────────────────────────────
//
// We match on the HOUR only (not minute-exact) because Vercel Cron
// fires at some point during the scheduled hour — exact minute
// delivery is not guaranteed on any plan. "08:00" means "send
// within the 08:xx window".

function isUserSendHour(prefs: ReminderPreferences, now: Date): boolean {
  const sendTime = prefs.send_time ?? '08:00'
  const timezone = prefs.timezone ?? 'Asia/Kuala_Lumpur'
  const [prefHourStr] = sendTime.split(':')
  const prefHour = parseInt(prefHourStr, 10)
  const localHour = getLocalHour(timezone, now)
  return localHour === prefHour
}


// ────────────────────────────────────────────────────────────
// GET /api/cron/send-reminders
//
// Auth: `Authorization: Bearer <CRON_SECRET>` header.
//   Vercel Cron sets this automatically when CRON_SECRET is
//   configured as an environment variable.
//
// Schedule: Runs hourly (0 * * * * in vercel.json).
//
// What it does (in order):
//   1. Auth-check the request.
//   2. Load every profile with telegram_enabled = true AND
//      a chat ID set, joined with their reminder_preferences row.
//   3. For each user: skip if their local time does NOT match
//      their preferred send_time hour (timezone-aware).
//   4. Fetch incomplete personal tasks + assigned project tasks.
//   5. Run findReminderCandidates() to filter to today's sends.
//   6. For each candidate, try to insert a reminder_logs row with
//      status='sent'. The unique constraint
//      (user_id, task_type, task_id, reminder_type, sent_date)
//      makes this a duplicate-prevention check: if insert succeeds,
//      we send. If it raises a unique-violation, we skip silently.
//   7. After insert succeeds, send the Telegram message. If sending
//      fails, update the log row to status='failed' + error_message.
// ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // ── 1. Auth ────────────────────────────────────────────
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET is not configured on the server.' },
      { status: 500 }
    )
  }
  const authHeader = req.headers.get('authorization') ?? ''
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()

  const summary = {
    users_checked: 0,
    users_skipped_time: 0,
    candidates_found: 0,
    sent: 0,
    skipped_duplicate: 0,
    failed: 0,
    errors: [] as string[],
  }

  // ── 2. Load opted-in users with their prefs ────────────
  const { data: users, error: usersErr } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      telegram_chat_id,
      telegram_enabled,
      reminder_preferences ( * )
    `)
    .eq('telegram_enabled', true)
    .not('telegram_chat_id', 'is', null)

  if (usersErr) {
    return NextResponse.json({ ok: false, error: usersErr.message }, { status: 500 })
  }

  const profiles = (users ?? []) as unknown as Array<
    Omit<ProfileWithPrefs, 'reminder_preferences'> & {
      // Supabase returns nested 1:1 relations as an object or array
      // depending on schema introspection — normalize below.
      reminder_preferences: ReminderPreferences | ReminderPreferences[] | null
    }
  >

  for (const profile of profiles) {
    summary.users_checked += 1

    const prefs = Array.isArray(profile.reminder_preferences)
      ? profile.reminder_preferences[0] ?? null
      : profile.reminder_preferences

    // If the user has never opened Settings, they have no prefs row.
    // Defaulting to "enabled with defaults" would surprise them with
    // unexpected DMs, so skip silently — they must opt in explicitly.
    if (!prefs || !prefs.enabled) continue

    // ── 3. Timezone-aware send-time check ────────────────
    // Only process this user if their local time matches their
    // preferred send_time hour. This prevents sending every hour.
    if (!isUserSendHour(prefs, now)) {
      summary.users_skipped_time += 1
      continue
    }

    // ── 4a. Fetch incomplete personal tasks ──────────────
    const { data: personalRaw, error: pErr } = await supabase
      .from('personal_tasks')
      .select(`
        id, user_id, title, status, progress, difficulty, due_date,
        course:courses ( code, name )
      `)
      .eq('user_id', profile.id)
      .neq('status', 'done')

    if (pErr) {
      summary.errors.push(`personal_tasks load for ${profile.id}: ${pErr.message}`)
      continue
    }

    // ── 4b. Fetch incomplete project tasks assigned to user ──
    const { data: projectRaw, error: prjErr } = await supabase
      .from('project_tasks')
      .select(`
        id, title, status, progress, difficulty, due_date, assigned_to,
        project:projects ( name )
      `)
      .eq('assigned_to', profile.id)
      .neq('status', 'done')

    if (prjErr) {
      summary.errors.push(`project_tasks load for ${profile.id}: ${prjErr.message}`)
      continue
    }

    // ── 5. Build flat candidate input ────────────────────
    // Supabase nests joined 1:1 rows as objects in some setups and
    // single-element arrays in others; handle both.
    const personalTasks = (personalRaw ?? []) as unknown as Array<
      Omit<PersonalTaskRow, 'course'> & {
        course: PersonalTaskRow['course'] | PersonalTaskRow['course'][]
      }
    >
    const projectTasks = (projectRaw ?? []) as unknown as Array<
      Omit<ProjectTaskRow, 'project'> & {
        project: ProjectTaskRow['project'] | ProjectTaskRow['project'][]
      }
    >

    const inputs: CandidateTaskInput[] = [
      ...personalTasks.map<CandidateTaskInput>((t) => {
        const c = Array.isArray(t.course) ? t.course[0] : t.course
        return {
          task_id: t.id,
          task_type: 'personal',
          title: t.title,
          status: t.status,
          progress: t.progress,
          difficulty: t.difficulty,
          due_date: t.due_date,
          course_label: c ? `${c.code} — ${c.name}` : undefined,
        }
      }),
      ...projectTasks.map<CandidateTaskInput>((t) => {
        const p = Array.isArray(t.project) ? t.project[0] : t.project
        return {
          task_id: t.id,
          task_type: 'project',
          title: t.title,
          status: t.status,
          progress: t.progress,
          difficulty: t.difficulty,
          due_date: t.due_date,
          project_name: p?.name,
        }
      }),
    ]

    const candidates = findReminderCandidates(inputs, prefs, now)
    summary.candidates_found += candidates.length

    // ── 6+7. For each candidate: dedupe-insert, then send ──
    for (const c of candidates) {
      // Try to claim today's slot for this (user, task, reminder_type).
      // status='sent' is optimistic — we patch to 'failed' below if
      // the actual Telegram call fails.
      const { error: insertErr } = await supabase.from('reminder_logs').insert({
        user_id: profile.id,
        task_type: c.task_type,
        task_id: c.task_id,
        reminder_type: c.reminder_type,
        sent_to: profile.telegram_chat_id,
        status: 'sent',
      })

      if (insertErr) {
        // 23505 = unique_violation → already sent today, skip.
        const code = (insertErr as { code?: string }).code
        if (code === '23505') {
          summary.skipped_duplicate += 1
          continue
        }
        summary.errors.push(`log insert: ${insertErr.message}`)
        summary.failed += 1
        continue
      }

      // ── Send the message ───────────────────────────────
      const message = generateReminderMessage(c, now)
      const result = await sendTelegramMessage(profile.telegram_chat_id, message)

      if (result.ok) {
        summary.sent += 1
      } else {
        summary.failed += 1
        // Patch the optimistic log row to reflect the failure so
        // the audit trail is accurate. We don't delete it — the
        // unique-key slot is still claimed, which means we won't
        // retry today. That's intentional: a broken chat ID
        // shouldn't cause a retry storm.
        await supabase
          .from('reminder_logs')
          .update({ status: 'failed', error_message: result.error ?? 'unknown' })
          .eq('user_id', profile.id)
          .eq('task_type', c.task_type)
          .eq('task_id', c.task_id)
          .eq('reminder_type', c.reminder_type)
          .eq('sent_date', new Date().toISOString().split('T')[0])
      }
    }
  }

  return NextResponse.json({ ok: true, summary })
}
