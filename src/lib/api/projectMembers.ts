import { createClient } from '@/lib/supabase'

// Shared result shape used by all member-management calls.
export interface MemberActionResult {
  ok: boolean
  error?: string
}

// Re-export as InviteResult alias for backward compat with DataContext imports.
export type InviteResult = MemberActionResult

/**
 * Create a pending invitation for a project member by email.
 * Replaces the old instant invite_member flow — the invitee now must
 * explicitly accept before they become a project member.
 * The invitee must already have a CourseFlow account.
 * Returns { ok, error } so the UI can show a message.
 */
export async function inviteMember(
  projectId: string,
  email: string,
  role: 'member' | 'admin'
): Promise<MemberActionResult> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('create_project_invitation', {
    p_project_id: projectId,
    p_invitee_email: email,
    p_role: role,
  })
  if (error) return { ok: false, error: error.message }
  return (data as MemberActionResult) ?? { ok: false, error: 'Unknown error' }
}

/**
 * Change a member's role (Viewer ↔ Editor).
 * Leader only. Cannot touch another leader's role.
 * Returns { ok, error }.
 */
export async function updateMemberRole(
  projectId: string,
  targetUserId: string,
  newRole: 'admin' | 'member'
): Promise<MemberActionResult> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('update_project_member_role', {
    p_project_id: projectId,
    p_target_user_id: targetUserId,
    p_new_role: newRole,
  })
  if (error) return { ok: false, error: error.message }
  return (data as MemberActionResult) ?? { ok: false, error: 'Unknown error' }
}

/**
 * Remove a member from a project.
 * Leader only. Blocked by the RPC if:
 *   - Target is the only leader
 *   - Target has active (non-done) assigned tasks
 * Returns { ok, error }.
 */
export async function removeMember(
  projectId: string,
  targetUserId: string
): Promise<MemberActionResult> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('remove_project_member', {
    p_project_id: projectId,
    p_target_user_id: targetUserId,
  })
  if (error) return { ok: false, error: error.message }
  return (data as MemberActionResult) ?? { ok: false, error: 'Unknown error' }
}

/**
 * Leave a project (self-removal). Any member can call this.
 * Blocked by the RPC if:
 *   - User is the only leader
 *   - User has active (non-done) assigned tasks
 * Returns { ok, error }.
 */
export async function leaveProject(
  projectId: string
): Promise<MemberActionResult> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('leave_project', {
    p_project_id: projectId,
  })
  if (error) return { ok: false, error: error.message }
  return (data as MemberActionResult) ?? { ok: false, error: 'Unknown error' }
}
