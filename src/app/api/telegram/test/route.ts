import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendTelegramMessage } from '@/lib/telegram'

/**
 * POST /api/telegram/test
 *
 * Sends a small "hello from CourseFlow" message to the signed-in
 * user's saved Telegram chat ID. Used by the "Send Test Reminder"
 * button on the Settings page.
 *
 * Auth: requires a logged-in Supabase session (read from cookies).
 * No CRON_SECRET — this is a user-initiated action.
 */
export async function POST() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {
          // No-op: a test send doesn't need to mutate session cookies.
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('telegram_chat_id, telegram_enabled, full_name')
    .eq('id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  if (!profile.telegram_chat_id) {
    return NextResponse.json(
      { ok: false, error: 'No Telegram chat ID saved. Add it under Settings first.' },
      { status: 400 }
    )
  }

  const name = profile.full_name || 'there'
  const message =
    `🦉 CourseFlow Test\n\n` +
    `Hi ${name}, your Telegram reminders are connected.\n\n` +
    `You'll receive automatic reminders for around-the-corner deadlines and high-risk tasks ` +
    `based on your preferences. You can adjust them under Settings → Telegram Reminders.`

  const result = await sendTelegramMessage(profile.telegram_chat_id, message)
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
