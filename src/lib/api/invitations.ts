import { createClient } from '@/lib/supabase'

export interface MemberActionResult {
  ok: boolean
  error?: string
}

/** Shape returned by the get_received_invitations() RPC. */
export interface ReceivedInvitation {
  id: string
  project_id: string
  project_name: string
  project_deadline: string
  project_status: string
  course_code?: string
  course_name?: string
  inviter_name: string
  inviter_email: string
  role: 'admin' | 'member'
  created_at: string
}

/** Pending invitations for projects the leader can manage. */
export interface ProjectInvitationForProject {
  id: string
  project_id: string
  invitee_user_id: string
  invitee_email: string
  invitee_name: string
  role: 'admin' | 'member'
  created_at: string
}

// ── Read ────────────────────────────────────────────────────

/**
 * Fetch pending invitations where the current user is the invitee.
 * Uses get_received_invitations() SECURITY DEFINER RPC so the project/course
 * data is visible even though the user isn't yet a project member.
 */
export async function getReceivedInvitations(): Promise<ReceivedInvitation[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_received_invitations')
  if (error) {
    console.error('[invitations] get_received_invitations error:', error.message)
    return []
  }
  return (data ?? []) as ReceivedInvitation[]
}

/**
 * Fetch pending invitations for all projects the current user manages.
 * RLS restricts results to projects where the user is a leader or editor.
 */
export async function getPendingInvitationsForManagedProjects(): Promise<ProjectInvitationForProject[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_invitations')
    .select(`
      id, project_id, invitee_user_id, invitee_email, role, created_at,
      invitee:profiles!project_invitations_invitee_user_id_fkey ( full_name, email )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[invitations] fetch managed error:', error.message)
    return []
  }

  return ((data ?? []) as unknown as Array<{
    id: string
    project_id: string
    invitee_user_id: string
    invitee_email: string
    role: 'admin' | 'member'
    created_at: string
    invitee: { full_name: string | null; email: string | null } | null
  }>).map((inv) => ({
    id: inv.id,
    project_id: inv.project_id,
    invitee_user_id: inv.invitee_user_id,
    invitee_email: inv.invitee_email,
    invitee_name: inv.invitee?.full_name || inv.invitee_email,
    role: inv.role,
    created_at: inv.created_at,
  }))
}

// ── Mutations ────────────────────────────────────────────────

/** Create a pending invitation (replaces the old instant invite_member flow). */
export async function createInvitation(
  projectId: string,
  email: string,
  role: 'admin' | 'member'
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

/** Accept a pending invitation (optionally with display name and personal course). */
export async function acceptInvitation(
  invitationId: string,
  displayName?: string,
  personalCourseId?: string
): Promise<MemberActionResult> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('accept_project_invitation', {
    p_invitation_id: invitationId,
    p_display_name: displayName ?? null,
    p_personal_course_id: personalCourseId ?? null,
  })
  if (error) return { ok: false, error: error.message }
  return (data as MemberActionResult) ?? { ok: false, error: 'Unknown error' }
}

/** Decline a pending invitation. */
export async function declineInvitation(invitationId: string): Promise<MemberActionResult> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('decline_project_invitation', {
    p_invitation_id: invitationId,
  })
  if (error) return { ok: false, error: error.message }
  return (data as MemberActionResult) ?? { ok: false, error: 'Unknown error' }
}

/** Cancel a pending invitation (Leader/Editor only). */
export async function cancelInvitation(invitationId: string): Promise<MemberActionResult> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('cancel_project_invitation', {
    p_invitation_id: invitationId,
  })
  if (error) return { ok: false, error: error.message }
  return (data as MemberActionResult) ?? { ok: false, error: 'Unknown error' }
}

/** Save per-member project preferences (display name, personal course). */
export async function updateMemberPreferences(
  projectId: string,
  displayName?: string,
  personalCourseId?: string
): Promise<MemberActionResult> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('update_project_member_preferences', {
    p_project_id: projectId,
    p_display_name: displayName ?? null,
    p_personal_course_id: personalCourseId ?? null,
  })
  if (error) return { ok: false, error: error.message }
  return (data as MemberActionResult) ?? { ok: false, error: 'Unknown error' }
}
