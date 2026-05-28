import { createClient } from '@/lib/supabase'
import type { ReminderPreferences, ReminderLog, ReminderDaysBefore } from '@/types'

// ── Preferences ──────────────────────────────────────────────

const DEFAULT_PREFS: Omit<ReminderPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  enabled: true,
  around_deadline_enabled: true,
  high_risk_enabled: true,
  days_before: 1,
  send_time: '08:00',
}

/** Fetch the signed-in user's reminder preferences (RLS restricts to own row). */
export async function getMyReminderPreferences(): Promise<ReminderPreferences | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reminder_preferences')
    .select('*')
    .maybeSingle()

  if (error) throw new Error(`Failed to load reminder preferences: ${error.message}`)
  return data as ReminderPreferences | null
}

export interface UpsertPreferencesInput {
  enabled: boolean
  around_deadline_enabled: boolean
  high_risk_enabled: boolean
  days_before: ReminderDaysBefore
  send_time?: string
}

/** Insert or update the signed-in user's reminder preferences row. */
export async function upsertMyReminderPreferences(
  input: UpsertPreferencesInput
): Promise<ReminderPreferences> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const payload = {
    user_id: user.id,
    enabled: input.enabled,
    around_deadline_enabled: input.around_deadline_enabled,
    high_risk_enabled: input.high_risk_enabled,
    days_before: input.days_before,
    send_time: input.send_time ?? DEFAULT_PREFS.send_time,
  }

  const { data, error } = await supabase
    .from('reminder_preferences')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to save reminder preferences: ${error.message}`)
  return data as ReminderPreferences
}

// ── Logs (read-only from the client) ─────────────────────────

/** Fetch the signed-in user's most recent reminder logs. */
export async function getMyRecentReminderLogs(limit = 10): Promise<ReminderLog[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reminder_logs')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to load reminder logs: ${error.message}`)
  return (data ?? []) as ReminderLog[]
}
