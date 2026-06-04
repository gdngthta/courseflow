-- ============================================================
-- Phase 6C.1 — Full Collaboration System: Database + RPCs
-- Run this entire file in the Supabase SQL Editor.
-- ============================================================

-- ── 1. project_invitations ──────────────────────────────────

create table if not exists public.project_invitations (
  id               uuid        primary key default gen_random_uuid(),
  project_id       uuid        not null references public.projects(id)  on delete cascade,
  inviter_id       uuid        not null references public.profiles(id)  on delete cascade,
  invitee_user_id  uuid        not null references public.profiles(id)  on delete cascade,
  invitee_email    text        not null,
  role             text        not null default 'member'
                               check (role in ('admin', 'member')),
  status           text        not null default 'pending'
                               check (status in ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
  created_at       timestamptz not null default now(),
  expires_at       timestamptz,
  responded_at     timestamptz
);

-- Only one active pending invitation per project+invitee pair
create unique index if not exists project_invitations_pending_unique
  on public.project_invitations (project_id, invitee_user_id)
  where (status = 'pending');

alter table public.project_invitations enable row level security;

drop policy if exists "invitee can view own invitations"               on public.project_invitations;
drop policy if exists "project leader/editor can view project invitations" on public.project_invitations;

-- Invitee sees their own invitations (all statuses, for history)
create policy "invitee can view own invitations"
  on public.project_invitations for select
  using (invitee_user_id = auth.uid());

-- Leaders and editors see all invitations for their projects
create policy "project leader/editor can view project invitations"
  on public.project_invitations for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_invitations.project_id
        and pm.user_id    = auth.uid()
        and pm.role       in ('leader', 'admin')
    )
  );

-- ── 2. project_member_preferences ───────────────────────────

create table if not exists public.project_member_preferences (
  id                  uuid        primary key default gen_random_uuid(),
  project_id          uuid        not null references public.projects(id) on delete cascade,
  user_id             uuid        not null references public.profiles(id) on delete cascade,
  display_name        text,
  personal_course_id  uuid        references public.courses(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (project_id, user_id)
);

alter table public.project_member_preferences enable row level security;

drop policy if exists "members manage own project preferences" on public.project_member_preferences;
create policy "members manage own project preferences"
  on public.project_member_preferences for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── 3. notifications ─────────────────────────────────────────

create table if not exists public.notifications (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  type         text        not null,
  title        text        not null,
  message      text        not null,
  entity_type  text,
  entity_id    uuid,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "users can read own notifications"   on public.notifications;
drop policy if exists "users can update own notifications" on public.notifications;

create policy "users can read own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "users can update own notifications"
  on public.notifications for update
  using      (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Fast lookup: unread count per user
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where (read_at is null);

-- ── 4. RPC: create_project_invitation ───────────────────────

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

  -- Caller must be Leader or Editor in this project
  select role into v_caller_role
  from project_members
  where project_id = p_project_id and user_id = v_caller_id;

  if v_caller_role is null or v_caller_role not in ('leader', 'admin') then
    return jsonb_build_object('ok', false, 'error', 'Only Leaders and Editors can invite members.');
  end if;

  -- Resolve invitee by email
  select id into v_invitee_id from profiles where email = p_invitee_email;

  if v_invitee_id is null then
    return jsonb_build_object('ok', false, 'error',
      'No CourseFlow account found with that email. Ask them to sign up first.');
  end if;

  if v_invitee_id = v_caller_id then
    return jsonb_build_object('ok', false, 'error', 'You cannot invite yourself.');
  end if;

  -- Block re-inviting an existing member
  select exists(
    select 1 from project_members
    where project_id = p_project_id and user_id = v_invitee_id
  ) into v_already_member;

  if v_already_member then
    return jsonb_build_object('ok', false, 'error', 'This user is already a member of this project.');
  end if;

  -- Block duplicate pending invitation
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

  -- Create invitation
  insert into project_invitations
    (project_id, inviter_id, invitee_user_id, invitee_email, role)
  values
    (p_project_id, v_caller_id, v_invitee_id, p_invitee_email, p_role)
  returning id into v_invitation_id;

  -- Notify invitee
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

-- ── 5. RPC: accept_project_invitation ───────────────────────

create or replace function public.accept_project_invitation(
  p_invitation_id      uuid,
  p_display_name       text default null,
  p_personal_course_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id       uuid := auth.uid();
  v_inv           record;
  v_user_name     text;
  v_project_name  text;
begin
  select * into v_inv
  from project_invitations
  where id = p_invitation_id and invitee_user_id = v_user_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Invitation not found.');
  end if;

  if v_inv.status != 'pending' then
    return jsonb_build_object('ok', false, 'error', 'This invitation is no longer pending.');
  end if;

  if v_inv.expires_at is not null and v_inv.expires_at < now() then
    update project_invitations set status = 'expired' where id = p_invitation_id;
    return jsonb_build_object('ok', false, 'error', 'This invitation has expired.');
  end if;

  -- Create membership
  insert into project_members (project_id, user_id, role)
  values (v_inv.project_id, v_user_id, v_inv.role)
  on conflict (project_id, user_id) do nothing;

  -- Mark invitation accepted
  update project_invitations
  set status = 'accepted', responded_at = now()
  where id = p_invitation_id;

  -- Save personalization preferences if supplied
  if p_display_name is not null or p_personal_course_id is not null then
    insert into project_member_preferences
      (project_id, user_id, display_name, personal_course_id)
    values
      (v_inv.project_id, v_user_id, p_display_name, p_personal_course_id)
    on conflict (project_id, user_id) do update
      set display_name       = excluded.display_name,
          personal_course_id = excluded.personal_course_id,
          updated_at         = now();
  end if;

  -- Notify inviter
  select full_name into v_user_name    from profiles where id = v_user_id;
  select name      into v_project_name from projects where id = v_inv.project_id;

  insert into notifications
    (user_id, type, title, message, entity_type, entity_id)
  values (
    v_inv.inviter_id,
    'project_invitation_accepted',
    'Invitation accepted',
    format('%s accepted your invitation to join "%s".',
      coalesce(v_user_name, 'Someone'), v_project_name),
    'project',
    v_inv.project_id
  );

  -- Auto-dismiss the original invitation notification for the invitee
  update notifications
  set read_at = now()
  where entity_type = 'project_invitation'
    and entity_id   = p_invitation_id
    and user_id     = v_user_id
    and read_at     is null;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.accept_project_invitation(uuid, text, uuid) to authenticated;

-- ── 6. RPC: decline_project_invitation ──────────────────────

create or replace function public.decline_project_invitation(
  p_invitation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id       uuid := auth.uid();
  v_inv           record;
  v_user_name     text;
  v_project_name  text;
begin
  select * into v_inv
  from project_invitations
  where id = p_invitation_id and invitee_user_id = v_user_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Invitation not found.');
  end if;

  if v_inv.status != 'pending' then
    return jsonb_build_object('ok', false, 'error', 'This invitation is no longer pending.');
  end if;

  update project_invitations
  set status = 'declined', responded_at = now()
  where id = p_invitation_id;

  -- Notify inviter
  select full_name into v_user_name    from profiles where id = v_user_id;
  select name      into v_project_name from projects where id = v_inv.project_id;

  insert into notifications
    (user_id, type, title, message, entity_type, entity_id)
  values (
    v_inv.inviter_id,
    'project_invitation_declined',
    'Invitation declined',
    format('%s declined your invitation to join "%s".',
      coalesce(v_user_name, 'Someone'), v_project_name),
    'project',
    v_inv.project_id
  );

  -- Auto-dismiss the original invitation notification for the invitee
  update notifications
  set read_at = now()
  where entity_type = 'project_invitation'
    and entity_id   = p_invitation_id
    and user_id     = v_user_id
    and read_at     is null;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.decline_project_invitation(uuid) to authenticated;

-- ── 7. RPC: cancel_project_invitation ───────────────────────

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

  -- Only Leaders and Editors can cancel
  select role into v_caller_role
  from project_members
  where project_id = v_inv.project_id and user_id = v_caller_id;

  if v_caller_role not in ('leader', 'admin') then
    return jsonb_build_object('ok', false, 'error', 'Only Leaders and Editors can cancel invitations.');
  end if;

  update project_invitations
  set status = 'cancelled'
  where id = p_invitation_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.cancel_project_invitation(uuid) to authenticated;

-- ── 8. RPC: get_received_invitations ────────────────────────
-- SECURITY DEFINER so it can join across project/course rows
-- that the invitee doesn't yet have RLS access to (not yet a member).

create or replace function public.get_received_invitations()
returns table (
  id               uuid,
  project_id       uuid,
  project_name     text,
  project_deadline text,
  project_status   text,
  course_code      text,
  course_name      text,
  inviter_name     text,
  inviter_email    text,
  role             text,
  created_at       timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    pi.id,
    pi.project_id,
    p.name                  as project_name,
    p.deadline::text        as project_deadline,
    p.status                as project_status,
    c.code                  as course_code,
    c.name                  as course_name,
    pr.full_name            as inviter_name,
    pr.email                as inviter_email,
    pi.role,
    pi.created_at
  from project_invitations pi
  join projects  p  on p.id  = pi.project_id
  left join courses c   on c.id  = p.course_id
  join profiles  pr on pr.id = pi.inviter_id
  where pi.invitee_user_id = auth.uid()
    and pi.status          = 'pending'
  order by pi.created_at desc;
$$;

grant execute on function public.get_received_invitations() to authenticated;

-- ── 9. RPC: update_project_member_preferences ───────────────

create or replace function public.update_project_member_preferences(
  p_project_id         uuid,
  p_display_name       text default null,
  p_personal_course_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id   uuid := auth.uid();
  v_is_member boolean;
begin
  select exists(
    select 1 from project_members
    where project_id = p_project_id and user_id = v_user_id
  ) into v_is_member;

  if not v_is_member then
    return jsonb_build_object('ok', false, 'error', 'You are not a member of this project.');
  end if;

  if p_personal_course_id is not null and not exists(
    select 1 from courses where id = p_personal_course_id and user_id = v_user_id
  ) then
    return jsonb_build_object('ok', false, 'error', 'Selected course does not belong to you.');
  end if;

  insert into project_member_preferences
    (project_id, user_id, display_name, personal_course_id)
  values
    (p_project_id, v_user_id, p_display_name, p_personal_course_id)
  on conflict (project_id, user_id) do update
    set display_name       = excluded.display_name,
        personal_course_id = excluded.personal_course_id,
        updated_at         = now();

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.update_project_member_preferences(uuid, text, uuid) to authenticated;

-- ── 10. RPC: mark_notification_read ─────────────────────────

create or replace function public.mark_notification_read(p_notification_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update notifications
  set read_at = now()
  where id      = p_notification_id
    and user_id = auth.uid()
    and read_at is null;
$$;

grant execute on function public.mark_notification_read(uuid) to authenticated;

-- ── 11. RPC: mark_all_notifications_read ────────────────────

create or replace function public.mark_all_notifications_read()
returns void
language sql
security definer
set search_path = public
as $$
  update notifications
  set read_at = now()
  where user_id = auth.uid() and read_at is null;
$$;

grant execute on function public.mark_all_notifications_read() to authenticated;

-- ── 12. Updated RPCs from phase6c2.sql (adds notifications) ─
-- DROP first to avoid "cannot change return type of existing function" errors
-- when Postgres sees a signature difference from the phase6c2 definitions.
drop function if exists public.update_project_member_role(uuid, uuid, text);
drop function if exists public.remove_project_member(uuid, uuid);
drop function if exists public.leave_project(uuid);

create or replace function public.update_project_member_role(
  p_project_id      uuid,
  p_target_user_id  uuid,
  p_new_role        text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id    uuid := auth.uid();
  v_caller_role  text;
  v_target_role  text;
  v_project_name text;
begin
  if p_new_role not in ('admin', 'member') then
    return jsonb_build_object('ok', false, 'error', 'Invalid role. Must be "admin" or "member".');
  end if;

  select role into v_caller_role
  from project_members
  where project_id = p_project_id and user_id = v_caller_id;

  if v_caller_role != 'leader' then
    return jsonb_build_object('ok', false, 'error', 'Only the project Leader can change member roles.');
  end if;

  if p_target_user_id = v_caller_id then
    return jsonb_build_object('ok', false, 'error', 'You cannot change your own role.');
  end if;

  select role into v_target_role
  from project_members
  where project_id = p_project_id and user_id = p_target_user_id;

  if v_target_role is null then
    return jsonb_build_object('ok', false, 'error', 'Member not found in this project.');
  end if;

  if v_target_role = 'leader' then
    return jsonb_build_object('ok', false, 'error', 'You cannot change another Leader''s role.');
  end if;

  update project_members
  set role = p_new_role
  where project_id = p_project_id and user_id = p_target_user_id;

  -- Notify the affected member
  select name into v_project_name from projects where id = p_project_id;
  insert into notifications (user_id, type, title, message, entity_type, entity_id)
  values (
    p_target_user_id,
    'project_role_changed',
    'Role updated',
    format('Your role in "%s" was changed to %s.',
      v_project_name,
      case p_new_role when 'admin' then 'Editor' else 'Viewer' end
    ),
    'project',
    p_project_id
  );

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.update_project_member_role(uuid, uuid, text) to authenticated;

create or replace function public.remove_project_member(
  p_project_id      uuid,
  p_target_user_id  uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id    uuid := auth.uid();
  v_caller_role  text;
  v_target_role  text;
  v_leader_count integer;
  v_active_tasks integer;
  v_project_name text;
begin
  select role into v_caller_role
  from project_members
  where project_id = p_project_id and user_id = v_caller_id;

  if v_caller_role != 'leader' then
    return jsonb_build_object('ok', false, 'error', 'Only the project Leader can remove members.');
  end if;

  if p_target_user_id = v_caller_id then
    return jsonb_build_object('ok', false, 'error', 'You cannot remove yourself. Use Leave Project instead.');
  end if;

  select role into v_target_role
  from project_members
  where project_id = p_project_id and user_id = p_target_user_id;

  if v_target_role is null then
    return jsonb_build_object('ok', false, 'error', 'Member not found in this project.');
  end if;

  if v_target_role = 'leader' then
    select count(*) into v_leader_count
    from project_members
    where project_id = p_project_id and role = 'leader';

    if v_leader_count <= 1 then
      return jsonb_build_object('ok', false, 'error', 'Cannot remove the only Leader.');
    end if;
  end if;

  select count(*) into v_active_tasks
  from project_tasks
  where project_id  = p_project_id
    and assigned_to = p_target_user_id
    and status      != 'done';

  if v_active_tasks > 0 then
    return jsonb_build_object('ok', false, 'error',
      format('Reassign or complete %s active task(s) before removing this member.', v_active_tasks));
  end if;

  delete from project_members
  where project_id = p_project_id and user_id = p_target_user_id;

  -- Notify the removed member
  select name into v_project_name from projects where id = p_project_id;
  insert into notifications (user_id, type, title, message, entity_type, entity_id)
  values (
    p_target_user_id,
    'project_member_removed',
    'Removed from project',
    format('You were removed from "%s".', v_project_name),
    'project',
    null
  );

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.remove_project_member(uuid, uuid) to authenticated;

create or replace function public.leave_project(p_project_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id      uuid := auth.uid();
  v_user_role    text;
  v_leader_count integer;
  v_active_tasks integer;
begin
  select role into v_user_role
  from project_members
  where project_id = p_project_id and user_id = v_user_id;

  if v_user_role is null then
    return jsonb_build_object('ok', false, 'error', 'You are not a member of this project.');
  end if;

  if v_user_role = 'leader' then
    select count(*) into v_leader_count
    from project_members
    where project_id = p_project_id and role = 'leader';

    if v_leader_count <= 1 then
      return jsonb_build_object('ok', false, 'error',
        'You are the only Leader. Promote another member before leaving.');
    end if;
  end if;

  select count(*) into v_active_tasks
  from project_tasks
  where project_id  = p_project_id
    and assigned_to = v_user_id
    and status      != 'done';

  if v_active_tasks > 0 then
    return jsonb_build_object('ok', false, 'error',
      format('You still have %s active task(s). Ask a Leader to reassign them first.', v_active_tasks));
  end if;

  delete from project_members
  where project_id = p_project_id and user_id = v_user_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.leave_project(uuid) to authenticated;

-- ── 13. Trigger: notify on project task assignment ───────────
-- Fires after INSERT or when assigned_to changes on UPDATE.

create or replace function public.notify_task_assigned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_name text;
begin
  -- Only act when there is an assignee and it changed (or is a new row)
  if new.assigned_to is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.assigned_to = old.assigned_to then
    return new;
  end if;

  select name into v_project_name from projects where id = new.project_id;

  insert into notifications (user_id, type, title, message, entity_type, entity_id)
  values (
    new.assigned_to,
    'project_task_assigned',
    'Task assigned',
    format('You were assigned "%s" in "%s".', new.title, v_project_name),
    'project_task',
    new.id
  );

  return new;
end;
$$;

drop trigger if exists on_project_task_assigned on public.project_tasks;
create trigger on_project_task_assigned
  after insert or update of assigned_to
  on public.project_tasks
  for each row
  execute function public.notify_task_assigned();
