import 'server-only'

export interface TelegramSendResult {
  ok: boolean
  error?: string
}

/**
 * Sends a plain-text message to a Telegram chat via the Bot API.
 *
 * Uses TELEGRAM_BOT_TOKEN — server-side only. The token is never
 * sent to the client or included in the response.
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN is not configured on the server.' }
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        // Plain text — no parse_mode, so the message renders as-is and
        // we don't have to escape Markdown/HTML special characters.
        disable_web_page_preview: true,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return {
        ok: false,
        error: `Telegram API ${res.status}: ${body.slice(0, 200) || res.statusText}`,
      }
    }

    const data = (await res.json()) as { ok: boolean; description?: string }
    if (!data.ok) {
      return { ok: false, error: data.description ?? 'Telegram returned ok=false' }
    }

    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown Telegram send error',
    }
  }
}
