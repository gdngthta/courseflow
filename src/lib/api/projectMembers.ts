import { createClient } from '@/lib/supabase'
import type { ProjectRole } from '@/types'

export interface InviteResult {
  ok: boolean
  error?: string
}

/**
 * Invite a member to a project by email (via the invite_member RPC).
 * The invited user must already have a CourseFlow account.
 * Returns { ok, error } rather than throwing so the UI can show a message.
 */
export async function inviteMember(
  projectId: string,
  email: string,
  role: ProjectRole
): Promise<InviteResult> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('invite_member', {
    p_project_id: projectId,
    p_email: email,
    p_role: role,
  })
  if (error) return { ok: false, error: error.message }
  return (data as InviteResult) ?? { ok: false, error: 'Unknown error' }
}
