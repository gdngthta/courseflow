import type { BotTaskItem, BotProjectItem } from '@/lib/telegramBotData'
import type { RiskStatus } from '@/types'

// ── Command identity ────────────────────────────────────────

export type BotCommand =
  | 'help'
  | 'critical'
  | 'today'
  | 'upcoming'
  | 'closest'
  | 'projects'
  | 'unknown'

const ALIASES: Record<Exclude<BotCommand, 'unknown'>, string[]> = {
  help: ['/help', 'help'],
  critical: [
    '/critical',
    'critical',
    'critical task',
    'critical tasks',
    'what is my critical task',
    'what are my critical tasks',
  ],
  today: [
    '/today',
    'today',
    'today task',
    'today tasks',
    'tasks today',
    'what should i do today',
  ],
  upcoming: [
    '/upcoming',
    'upcoming',
    'deadline',
    'deadlines',
    'upcoming deadline',
    'upcoming deadlines',
  ],
  closest: [
    '/closest',
    'closest',
    'closest deadline',
    'nearest deadline',
    'next deadline',
    'what is my closest deadline',
  ],
  projects: [
    '/projects',
    'projects',
    'active projects',
    'my projects',
  ],
}

/**
 * Parse a raw Telegram message into a BotCommand.
 *
 * Rules:
 *  - Lower-case + trim + collapse whitespace + strip trailing punctuation.
 *  - Slash commands: strip `@BotName` suffix Telegram appends in group chats.
 *  - Exact-match against alias map (no fuzzy / NLP — explicitly out of scope).
 */
export function parseCommand(rawText: string): BotCommand {
  if (!rawText) return 'unknown'

  let text = rawText.trim().toLowerCase()

  // Strip @botname suffix on slash commands (group chats use /help@MyBot).
  if (text.startsWith('/')) {
    const firstWord = text.split(/\s+/)[0]
    text = firstWord.split('@')[0]
  } else {
    // Collapse whitespace and trim trailing ?, !, .
    text = text.replace(/\s+/g, ' ').replace(/[?!.]+$/, '').trim()
  }

  for (const [cmd, aliases] of Object.entries(ALIASES) as [
    Exclude<BotCommand, 'unknown'>,
    string[],
  ][]) {
    if (aliases.includes(text)) return cmd
  }
  return 'unknown'
}

// ── Date formatting ─────────────────────────────────────────

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function daysUntil(due_date: string, today: Date = new Date()): number {
  const due = new Date(due_date + 'T00:00:00')
  const start = startOfDay(today)
  return Math.round((due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatDueLabel(due_date: string, today: Date = new Date()): string {
  const days = daysUntil(due_date, today)
  if (days < -1) return `Overdue (${Math.abs(days)} days ago)`
  if (days === -1) return 'Overdue (yesterday)'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  // Otherwise show absolute date
  return new Date(due_date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function riskLabel(r: RiskStatus): string {
  return r.charAt(0).toUpperCase() + r.slice(1)
}

// ── Task block (shared by /critical, /today, /closest) ──────

function renderTaskBlock(t: BotTaskItem, index: number, today: Date): string {
  const contextLine =
    t.task_type === 'personal'
      ? `Course: ${t.course_label ?? 'No course'}`
      : `Project: ${t.project_name ?? 'Untitled project'}`

  return [
    `${index}. ${t.title}`,
    contextLine,
    `Due: ${formatDueLabel(t.due_date, today)}`,
    `Risk: ${riskLabel(t.risk)}`,
    `Progress: ${t.progress}%`,
  ].join('\n')
}

// ── /help ───────────────────────────────────────────────────

export function formatHelp(): string {
  return [
    '🦉 CourseFlow Bot Commands',
    '',
    '/critical — show critical tasks',
    '/today — show today\'s tasks',
    '/upcoming — show upcoming deadlines',
    '/closest — show your closest upcoming deadline',
    '/projects — show active projects',
    '/help — show this help message',
  ].join('\n')
}

// ── /critical ───────────────────────────────────────────────

export function formatCritical(tasks: BotTaskItem[], today: Date = new Date()): string {
  const critical = tasks
    .filter((t) => t.risk === 'critical')
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 5)

  if (critical.length === 0) {
    return [
      '🦉 CourseFlow Critical Tasks',
      '',
      'No critical tasks right now. You\'re clear for the moment.',
    ].join('\n')
  }

  const blocks = critical.map((t, i) => renderTaskBlock(t, i + 1, today))
  const closest = critical[0]
  return [
    '🦉 CourseFlow Critical Tasks',
    '',
    blocks.join('\n\n'),
    '',
    'Closest deadline:',
    `${closest.title} — ${formatDueLabel(closest.due_date, today)}`,
  ].join('\n')
}

// ── /today ──────────────────────────────────────────────────

export function formatToday(tasks: BotTaskItem[], today: Date = new Date()): string {
  // Include: due today OR risk=critical (even if not due today).
  // Dedupe (a critical-AND-due-today task should only appear once).
  const eligible = new Map<string, BotTaskItem>()
  for (const t of tasks) {
    const days = daysUntil(t.due_date, today)
    if (days === 0 || t.risk === 'critical') {
      eligible.set(t.task_id, t)
    }
  }

  if (eligible.size === 0) {
    return [
      '🦉 Today\'s CourseFlow Tasks',
      '',
      'No urgent task for today.',
    ].join('\n')
  }

  // Sort: critical first, then by due date ascending.
  const sorted = Array.from(eligible.values()).sort((a, b) => {
    const aC = a.risk === 'critical' ? 0 : 1
    const bC = b.risk === 'critical' ? 0 : 1
    if (aC !== bC) return aC - bC
    return a.due_date.localeCompare(b.due_date)
  }).slice(0, 5)

  const blocks = sorted.map((t, i) => renderTaskBlock(t, i + 1, today))
  return [
    '🦉 Today\'s CourseFlow Tasks',
    '',
    blocks.join('\n\n'),
    '',
    'Focus first:',
    sorted[0].title,
  ].join('\n')
}

// ── /upcoming ───────────────────────────────────────────────

export interface UpcomingProjectDeadline {
  project_id: string
  project_name: string
  deadline: string
}

export function formatUpcoming(
  tasks: BotTaskItem[],
  projectDeadlines: UpcomingProjectDeadline[],
  today: Date = new Date()
): string {
  // Per-bucket caps so the message stays under Telegram's 4096-char limit
  // even when the user has dozens of upcoming items.
  const PER_BUCKET = 8

  interface Row {
    label: string
    suffix: string
    due_date: string
    days: number
  }

  const rows: Row[] = []

  for (const t of tasks) {
    const days = daysUntil(t.due_date, today)
    if (days < 0 || days > 7) continue
    rows.push({
      label: `- ${t.title}`,
      suffix: riskLabel(t.risk),
      due_date: t.due_date,
      days,
    })
  }

  for (const p of projectDeadlines) {
    const days = daysUntil(p.deadline, today)
    if (days < 0 || days > 7) continue
    rows.push({
      label: `- ${p.project_name}`,
      suffix: 'Project Deadline',
      due_date: p.deadline,
      days,
    })
  }

  if (rows.length === 0) {
    return [
      '🦉 Upcoming Deadlines',
      '',
      'No upcoming deadlines found.',
    ].join('\n')
  }

  rows.sort((a, b) => a.due_date.localeCompare(b.due_date))

  const today_ = rows.filter((r) => r.days === 0).slice(0, PER_BUCKET)
  const tomorrow_ = rows.filter((r) => r.days === 1).slice(0, PER_BUCKET)
  const thisWeek_ = rows.filter((r) => r.days >= 2 && r.days <= 7).slice(0, PER_BUCKET)

  const lines: string[] = ['🦉 Upcoming Deadlines', '']
  if (today_.length) {
    lines.push('Today')
    today_.forEach((r) => lines.push(`${r.label} — ${r.suffix}`))
    lines.push('')
  }
  if (tomorrow_.length) {
    lines.push('Tomorrow')
    tomorrow_.forEach((r) => lines.push(`${r.label} — ${r.suffix}`))
    lines.push('')
  }
  if (thisWeek_.length) {
    lines.push('This Week')
    thisWeek_.forEach((r) => lines.push(`${r.label} — ${r.suffix}`))
    lines.push('')
  }

  // Trim trailing blank line
  while (lines[lines.length - 1] === '') lines.pop()

  return lines.join('\n')
}

// ── /closest ────────────────────────────────────────────────

export type ClosestItem =
  | { kind: 'task'; task: BotTaskItem }
  | { kind: 'project_deadline'; project_id: string; project_name: string; deadline: string; progress: number }

export function formatClosest(items: ClosestItem[], today: Date = new Date()): string {
  if (items.length === 0) {
    return [
      '🦉 Closest CourseFlow Deadlines',
      '',
      'No upcoming incomplete task or active project deadline found.',
    ].join('\n')
  }

  const blocks: string[] = []
  let nextAction = ''

  items.forEach((it, idx) => {
    const n = idx + 1
    if (it.kind === 'task') {
      const t = it.task
      blocks.push(renderTaskBlock(t, n, today))
      if (idx === 0) {
        const days = daysUntil(t.due_date, today)
        if (days < 0) nextAction = 'This task is overdue. Handle it as soon as possible.'
        else if (t.risk === 'critical') nextAction = 'Focus on this first.'
        else if (days === 0) nextAction = 'Focus on this today.'
        else if (days === 1) nextAction = 'Prepare this before tomorrow.'
        else nextAction = 'Finish the remaining checklist soon.'
      }
    } else {
      blocks.push([
        `${n}. ${it.project_name}`,
        'Type: Project Deadline',
        `Due: ${formatDueLabel(it.deadline, today)}`,
        `Progress: ${it.progress}%`,
      ].join('\n'))
      if (idx === 0) nextAction = 'Review remaining project tasks.'
    }
  })

  return [
    '🦉 Closest CourseFlow Deadlines',
    '',
    blocks.join('\n\n'),
    '',
    'Next action:',
    nextAction,
  ].join('\n')
}

/**
 * Pick the closest-deadline items from a combined list of incomplete
 * tasks + active-project deadlines. Returns up to 3 items sorted by
 * nearest date ascending, so overdue items naturally surface first.
 */
const CLOSEST_LIMIT = 3

export function deriveClosestDeadlineItems(
  tasks: BotTaskItem[],
  projects: BotProjectItem[]
): ClosestItem[] {
  const candidates: { date: string; item: ClosestItem }[] = []

  for (const t of tasks) {
    candidates.push({ date: t.due_date, item: { kind: 'task', task: t } })
  }
  for (const p of projects) {
    // Skip projects whose tasks are all done. status='active' alone isn't
    // enough — the user may not have clicked "Mark as Completed" yet.
    // A 100%-progress project is done in practice and shouldn't surface
    // as an upcoming deadline.
    if (p.progress >= 100) continue
    candidates.push({
      date: p.deadline,
      item: {
        kind: 'project_deadline',
        project_id: p.id,
        project_name: p.name,
        deadline: p.deadline,
        progress: p.progress,
      },
    })
  }

  if (candidates.length === 0) return []

  candidates.sort((a, b) => a.date.localeCompare(b.date))
  return candidates.slice(0, CLOSEST_LIMIT).map((c) => c.item)
}

// ── /projects ──────────────────────────────────────────────

export function formatProjects(projects: BotProjectItem[], today: Date = new Date()): string {
  if (projects.length === 0) {
    return [
      '🦉 Active CourseFlow Projects',
      '',
      'No active projects found.',
    ].join('\n')
  }

  const top = projects
    .slice()
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 5)

  const blocks = top.map((p, i) => {
    const role = p.role.charAt(0).toUpperCase() + p.role.slice(1)
    return [
      `${i + 1}. ${p.name}`,
      `Progress: ${p.progress}%`,
      `Deadline: ${formatDueLabel(p.deadline, today)}`,
      `Role: ${role}`,
    ].join('\n')
  })

  return [
    '🦉 Active CourseFlow Projects',
    '',
    blocks.join('\n\n'),
  ].join('\n')
}

// ── Fallbacks ──────────────────────────────────────────────

export function formatUnknown(): string {
  return 'I didn\'t understand that. Try /critical, /today, /upcoming, /closest, /projects, or /help.'
}

export function formatNotConnected(): string {
  return 'Your Telegram is not connected to CourseFlow yet. Please connect it in CourseFlow Settings.'
}
