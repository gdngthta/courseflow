import { createClient } from '@/lib/supabase'

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  telegram_chat_id?: string
  telegram_enabled: boolean
  created_at: string
}

interface ProfileRow {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  telegram_chat_id: string | null
  telegram_enabled: boolean | null
  created_at: string
}

function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name ?? '',
    avatar_url: row.avatar_url ?? undefined,
    telegram_chat_id: row.telegram_chat_id ?? undefined,
    telegram_enabled: row.telegram_enabled ?? false,
    created_at: row.created_at,
  }
}

/** Fetch the signed-in user's profile (RLS restricts to own row). */
export async function getMyProfile(): Promise<Profile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .maybeSingle()

  if (error) throw new Error(`Failed to load profile: ${error.message}`)
  return data ? rowToProfile(data as ProfileRow) : null
}

/**
 * Ensure a profile row exists for the currently-authenticated user.
 *
 * Why this exists: a profile row is supposed to be auto-created by the
 * `handle_new_user` trigger on `auth.users`. But:
 *   1. Users whose auth account pre-dates the trigger (e.g. created in
 *      an earlier dev phase before schema.sql was applied) have no
 *      profile row.
 *   2. If the trigger ever fails silently for any reason, the user is
 *      left orphaned.
 *
 * Either case causes every downstream insert (personal_tasks, courses,
 * etc.) to fail with a foreign-key violation against `profiles(id)`.
 *
 * This function is the defensive fallback: called from AuthContext
 * once the user is loaded, it confirms the row exists or creates it.
 *
 * Idempotent. Throws if Supabase rejects the insert AND there is still
 * no row (caller decides how to surface that — typically blocks the app
 * with a clear error rather than silently proceeding).
 */
export async function ensureProfile(): Promise<Profile> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Fast path: does it already exist?
  const { data: existing, error: selectErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (selectErr) throw new Error(`Profile lookup failed: ${selectErr.message}`)
  if (existing) return rowToProfile(existing as ProfileRow)

  // Slow path: insert. Uses `profiles_insert` RLS policy from phase5.sql.
  const fullName = (user.user_metadata?.full_name as string | undefined)?.trim()
    || user.email?.split('@')[0]
    || ''

  const { data: inserted, error: insertErr } = await supabase
    .from('profiles')
    .insert({ id: user.id, email: user.email ?? '', full_name: fullName })
    .select('*')
    .single()

  if (insertErr) {
    // One legitimate way this can fail is a race where the trigger fired
    // between our SELECT and our INSERT. Re-fetch once before giving up.
    const { data: raceCheck } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    if (raceCheck) return rowToProfile(raceCheck as ProfileRow)

    throw new Error(
      `Failed to ensure profile: ${insertErr.message}. ` +
      `Run supabase/phase5.sql in the SQL Editor to add the profiles_insert ` +
      `RLS policy and backfill any missing rows.`
    )
  }
  return rowToProfile(inserted as ProfileRow)
}

/**
 * Update the signed-in user's profile name / avatar / Telegram fields.
 *
 * Defensive: strips `undefined` entries before sending so we never
 * accidentally null-out a column the caller didn't intend to touch.
 * Also trims `full_name` so leading/trailing whitespace doesn't poison
 * the `auth.users.raw_user_meta_data` mirror that gets copied alongside.
 */
export async function updateMyProfile(input: {
  full_name?: string
  avatar_url?: string
  telegram_chat_id?: string | null
  telegram_enabled?: boolean
}): Promise<Profile> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const payload: Record<string, unknown> = {}
  if (input.full_name !== undefined) payload.full_name = input.full_name.trim()
  if (input.avatar_url !== undefined) payload.avatar_url = input.avatar_url || null
  if (input.telegram_chat_id !== undefined) {
    const cleaned = typeof input.telegram_chat_id === 'string' ? input.telegram_chat_id.trim() : input.telegram_chat_id
    payload.telegram_chat_id = cleaned || null
  }
  if (input.telegram_enabled !== undefined) payload.telegram_enabled = !!input.telegram_enabled

  if (Object.keys(payload).length === 0) {
    // Nothing to update — short-circuit with current row to avoid a no-op
    // round-trip that some PostgREST versions reject with an empty body.
    const current = await getMyProfile()
    if (!current) throw new Error('Profile not found')
    return current
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', user.id)
    .select('*')
    .single()

  if (error) throw new Error(`Failed to update profile: ${error.message}`)
  return rowToProfile(data as ProfileRow)
}
