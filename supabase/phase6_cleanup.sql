-- ============================================================
-- phase6_cleanup.sql — Security + correctness fixes
-- Run AFTER phase6c1.sql.
-- Safe to run multiple times (all statements are idempotent).
-- ============================================================

-- ── 1. Drop the old invite_member RPC ───────────────────────
-- The app now uses create_project_invitation → accept_project_invitation.
-- The old RPC added members immediately, bypassing the invitation acceptance
-- flow and the notifications system. Any authenticated user could call it
-- directly via the Supabase JS client.
drop function if exists public.invite_member(uuid, text, text);

-- ── 2. Normalize existing send_time values to '06:00' ───────
-- Reminder time is now fixed at 6:00 AM local time; the send_time column
-- is no longer user-configurable. Set all existing rows to '06:00' so
-- the DB stays consistent with the new cron behavior.
update public.reminder_preferences
set send_time = '06:00'
where send_time is distinct from '06:00';

-- ── 3. Fix create_project_invitation — case-insensitive email lookup ──
-- Previously `WHERE email = p_invitee_email` was case-sensitive, so
-- an inviter typing "user@example.com" would fail to find "User@Example.com".
create or replace function public.create_project_invitation(
  p_project_id    uuid,
  p_invitee_email text,
  p_role          text default 'member'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id      uuid := auth.uid();
  v_caller_role    text;
  v_invitee_id     uuid;
  v_invitation_id  uuid;
  v_already_member boolean;
  v_pending_exists boolean;
  v_project_name   text;
  v_caller_name    text;
begin
  if p_role not in ('admin', 'member') then
    return jsonb_build_object('ok', false, 'error', 'Invalid role.');
  end if;

  select role into v_caller_role
  from project_members
  where project_id = p_project_id and user_id = v_caller_id;

  if v_caller_role is null or v_caller_role not in ('leader', 'admin') then
    return jsonb_build_object('ok', false, 'error', 'Only Leaders and Editors can invite members.');
  end if;

  -- Case-insensitive email lookup (fixed from original case-sensitive version).
  select id into v_invitee_id
  from profiles
  where lower(email) = lower(p_invitee_email);

  if v_invitee_id is null then
    return jsonb_build_object('ok', false, 'error',
      'No CourseFlow account found with that email. Ask them to sign up first.');
  end if;

  if v_invitee_id = v_caller_id then
    return jsonb_build_object('ok', false, 'error', 'You cannot invite yourself.');
  end if;

  select exists(
    select 1 from project_members
    where project_id = p_project_id and user_id = v_invitee_id
  ) into v_already_member;

  if v_already_member then
    return jsonb_build_object('ok', false, 'error', 'This user is already a member of this project.');
  end if;

  select exists(
    select 1 from project_invitations
    where project_id       = p_project_id
      and invitee_user_id  = v_invitee_id
      and status           = 'pending'
  ) into v_pending_exists;

  if v_pending_exists then
    return jsonb_build_object('ok', false, 'error',
      'This user already has a pending invitation to this project.');
  end if;

  select name into v_project_name from projects where id = p_project_id;
  select full_name into v_caller_name from profiles where id = v_caller_id;

  insert into project_invitations
    (project_id, inviter_id, invitee_user_id, invitee_email, role)
  values
    (p_project_id, v_caller_id, v_invitee_id, p_invitee_email, p_role)
  returning id into v_invitation_id;

  insert into notifications
    (user_id, type, title, message, entity_type, entity_id)
  values (
    v_invitee_id,
    'project_invitation_received',
    'Project invitation',
    format('%s invited you to join "%s" as %s.',
      coalesce(v_caller_name, 'Someone'),
      v_project_name,
      case p_role when 'admin' then 'Editor' else 'Viewer' end
    ),
    'project_invitation',
    v_invitation_id
  );

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.create_project_invitation(uuid, text, text) to authenticated;

-- ── 4. Fix cancel_project_invitation — clean up invitee notification ──
-- Previously cancelling an invitation left the invitee's "Project invitation"
-- notification unread. The invitee could still see it in the bell panel,
-- and clicking it would navigate to /projects with no pending invitation visible.
create or replace function public.cancel_project_invitation(
  p_invitation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id   uuid := auth.uid();
  v_caller_role text;
  v_inv         record;
begin
  select * into v_inv
  from project_invitations
  where id = p_invitation_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Invitation not found.');
  end if;

  if v_inv.status != 'pending' then
    return jsonb_build_object('ok', false, 'error', 'This invitation is no longer pending.');
  end if;

  select role into v_caller_role
  from project_members
  where project_id = v_inv.project_id and user_id = v_caller_id;

  if v_caller_role not in ('leader', 'admin') then
    return jsonb_build_object('ok', false, 'error', 'Only Leaders and Editors can cancel invitations.');
  end if;

  update project_invitations
  set status = 'cancelled'
  where id = p_invitation_id;

  -- Mark the invitee's notification as read so the stale bell entry disappears.
  update notifications
  set read_at = now()
  where entity_type = 'project_invitation'
    and entity_id   = p_invitation_id
    and read_at     is null;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.cancel_project_invitation(uuid) to authenticated;
