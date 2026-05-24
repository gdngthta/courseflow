import { createClient } from '@/lib/supabase'

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: string
}

interface ProfileRow {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name ?? '',
    avatar_url: row.avatar_url ?? undefined,
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

/** Update the signed-in user's profile name / avatar. */
export async function updateMyProfile(input: {
  full_name?: string
  avatar_url?: string
}): Promise<Profile> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .update(input)
    .eq('id', user.id)
    .select('*')
    .single()

  if (error) throw new Error(`Failed to update profile: ${error.message}`)
  return rowToProfile(data as ProfileRow)
}
