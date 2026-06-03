import { NextResponse, type NextRequest } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram'
import {
  findProfileByChatId,
  fetchCombinedIncompleteTasks,
  fetchActiveProjects,
} from '@/lib/telegramBotData'
import {
  parseCommand,
  formatStart,
  formatHelp,
  formatCritical,
  formatToday,
  formatUpcoming,
  formatClosest,
  formatProjects,
  formatUnknown,
  formatNotConnected,
  deriveClosestDeadlineItems,
  type UpcomingProjectDeadline,
} from '@/lib/telegramBotFormat'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── Telegram update payload (only the bits we use) ──────────

interface TelegramUpdate {
  update_id?: number
  message?: {
    message_id?: number
    text?: string
    chat?: { id?: number | string; type?: string }
    from?: { id?: number; username?: string }
  }
}

/**
 * POST /api/telegram/webhook
 *
 * Receives updates from Telegram, routes commands, sends replies.
 *
 * Security:
 *   1. If TELEGRAM_WEBHOOK_SECRET is set, Telegram MUST forward it
 *      in the `X-Telegram-Bot-Api-Secret-Token` header. We reject
 *      anything else as 401. (Telegram lets you register a secret
 *      when setting the webhook URL — that's the supported way.)
 *   2. Authorization is by chat_id → profile mapping. A Telegram
 *      user that isn't connected gets the not-connected reply and
 *      no data leak.
 *
 * Response model:
 *   - We ALWAYS return HTTP 200 to Telegram (unless auth fails),
 *     even on internal errors, so Telegram doesn't retry the same
 *     update forever. The user-facing reply is sent via sendMessage.
 */
export async function POST(req: NextRequest) {
  // ── 1. Secret-header auth (if configured) ──────────────────
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (expectedSecret) {
    const got = req.headers.get('x-telegram-bot-api-secret-token')
    if (got !== expectedSecret) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
  }

  // ── 2. Parse update ────────────────────────────────────────
  let update: TelegramUpdate
  try {
    update = (await req.json()) as TelegramUpdate
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const chatId = update.message?.chat?.id
  const text = update.message?.text

  if (!chatId || !text) {
    // Not a text message (could be a media update, edit, etc.) — ignore.
    return NextResponse.json({ ok: true, skipped: 'no_text' })
  }

  const chatIdStr = String(chatId)

  // ── 3. Identify the CourseFlow user ────────────────────────
  let profile
  try {
    profile = await findProfileByChatId(chatIdStr)
  } catch (err) {
    console.error('[telegram webhook] profile lookup failed', err)
    await sendTelegramMessage(chatIdStr, 'Sorry — something went wrong on our side.').catch(() => {})
    return NextResponse.json({ ok: true, error: 'profile_lookup_failed' })
  }

  if (!profile) {
    await sendTelegramMessage(chatIdStr, formatNotConnected()).catch(() => {})
    return NextResponse.json({ ok: true, status: 'not_connected' })
  }

  // ── 4. Parse + dispatch ────────────────────────────────────
  const command = parseCommand(text)
  const today = new Date()

  let reply: string
  try {
    switch (command) {
      case 'start': {
        reply = formatStart(profile.full_name || undefined)
        break
      }

      case 'help': {
        reply = formatHelp()
        break
      }

      case 'critical': {
        const tasks = await fetchCombinedIncompleteTasks(profile.id)
        reply = formatCritical(tasks, today)
        break
      }

      case 'today': {
        const tasks = await fetchCombinedIncompleteTasks(profile.id)
        reply = formatToday(tasks, today)
        break
      }

      case 'upcoming': {
        const [tasks, projects] = await Promise.all([
          fetchCombinedIncompleteTasks(profile.id),
          fetchActiveProjects(profile.id),
        ])
        // Skip projects already at 100% — same logic as /closest.
        const deadlines: UpcomingProjectDeadline[] = projects
          .filter((p) => p.progress < 100)
          .map((p) => ({
            project_id: p.id,
            project_name: p.name,
            deadline: p.deadline,
          }))
        reply = formatUpcoming(tasks, deadlines, today)
        break
      }

      case 'closest': {
        const [tasks, projects] = await Promise.all([
          fetchCombinedIncompleteTasks(profile.id),
          fetchActiveProjects(profile.id),
        ])
        const items = deriveClosestDeadlineItems(tasks, projects)
        reply = formatClosest(items, today)
        break
      }

      case 'projects': {
        const projects = await fetchActiveProjects(profile.id)
        reply = formatProjects(projects, today)
        break
      }

      case 'unknown':
      default:
        reply = formatUnknown()
    }
  } catch (err) {
    console.error('[telegram webhook] handler failed', err)
    reply = 'Sorry — something went wrong while loading your data. Try again in a moment.'
  }

  // ── 5. Send reply ──────────────────────────────────────────
  const sent = await sendTelegramMessage(chatIdStr, reply)
  if (!sent.ok) {
    console.error('[telegram webhook] send failed', sent.error)
  }

  return NextResponse.json({ ok: true })
}
