-- ============================================================
-- Phase 6C.2 — Project Member Management
-- ============================================================
-- New RPCs for:
--   • update_project_member_role — leader changes Viewer ↔ Editor
--   • remove_project_member      — leader removes a member (with guards)
--   • leave_project              — any non-leader member leaves
--
-- Guards enforced inside each RPC (SECURITY DEFINER bypasses RLS):
--   • Only the project leader can manage members
--   • Cannot demote / remove the only leader
--   • Cannot remove / leave if member has active (non-done) assigned tasks
-- ============================================================


-- ------------------------------------------------------------
-- 1. update_project_member_role
--    Leader changes an Editor → Viewer or Viewer → Editor.
--    Cannot touch another leader's role.
-- ------------------------------------------------------------

create or replace function public.update_project_member_role(
  p_project_id     uuid,
  p_target_user_id uuid,
  p_new_role       text          -- 'admin' (Editor) or 'member' (Viewer)
)
returns json
language plpgsql security definer set search_path = public as $$
declare
  target_current_role text;
begin
  -- Caller must be a leader.
  if not is_project_leader(p_project_id) then
    return json_build_object('ok', false, 'error',
      'Only the project leader can change member roles.');
  end if;

  -- Cannot change your own role via this function.
  if p_target_user_id = auth.uid() then
    return json_build_object('ok', false, 'error',
      'You cannot change your own role.');
  end if;

  -- Only 'admin' (Editor) and 'member' (Viewer) are valid targets.
  if p_new_role not in ('admin', 'member') then
    return json_build_object('ok', false, 'error',
      'Invalid role. Choose Editor or Viewer.');
  end if;

  -- Look up the target's current role.
  select role into target_current_role
  from public.project_members
  where project_id = p_project_id and user_id = p_target_user_id;

  if target_current_role is null then
    return json_build_object('ok', false, 'error',
      'Member not found in this project.');
  end if;

  -- Cannot change another leader's role (protect multi-leader setups).
  if target_current_role = 'leader' then
    return json_build_object('ok', false, 'error',
      'Cannot change a leader''s role. Transfer leadership manually.');
  end if;

  -- No-op if role is already the requested value.
  if target_current_role = p_new_role then
    return json_build_object('ok', true);
  end if;

  update public.project_members
  set role = p_new_role
  where project_id = p_project_id and user_id = p_target_user_id;

  return json_build_object('ok', true);
end;
$$;


-- ------------------------------------------------------------
-- 2. remove_project_member
--    Leader removes a Viewer or Editor.
--    Blocked if: target is the only leader, or has active tasks.
-- ------------------------------------------------------------

create or replace function public.remove_project_member(
  p_project_id     uuid,
  p_target_user_id uuid
)
returns json
language plpgsql security definer set search_path = public as $$
declare
  target_role       text;
  leader_count      integer;
  active_task_count integer;
begin
  -- Caller must be a leader.
  if not is_project_leader(p_project_id) then
    return json_build_object('ok', false, 'error',
      'Only the project leader can remove members.');
  end if;

  -- Use leave_project for self-removal.
  if p_target_user_id = auth.uid() then
    return json_build_object('ok', false, 'error',
      'To leave a project use the Leave Project action.');
  end if;

  -- Fetch target's role.
  select role into target_role
  from public.project_members
  where project_id = p_project_id and user_id = p_target_user_id;

  if target_role is null then
    return json_build_object('ok', false, 'error',
      'Member not found in this project.');
  end if;

  -- If target is also a leader, ensure there is at least one other leader left.
  if target_role = 'leader' then
    select count(*) into leader_count
    from public.project_members
    where project_id = p_project_id and role = 'leader';

    if leader_count <= 1 then
      return json_build_object('ok', false, 'error',
        'Cannot remove the only leader. Transfer leadership first.');
    end if;
  end if;

  -- Block if target has active (non-done) assigned tasks.
  select count(*) into active_task_count
  from public.project_tasks
  where project_id = p_project_id
    and assigned_to = p_target_user_id
    and status != 'done';

  if active_task_count > 0 then
    return json_build_object('ok', false, 'error',
      format('Reassign or complete this member''s %s active task(s) before removing them.',
             active_task_count));
  end if;

  delete from public.project_members
  where project_id = p_project_id and user_id = p_target_user_id;

  return json_build_object('ok', true);
end;
$$;


-- ------------------------------------------------------------
-- 3. leave_project
--    Any member can leave. Blocked if: only leader, or has
--    active tasks assigned in this project.
-- ------------------------------------------------------------

create or replace function public.leave_project(
  p_project_id uuid
)
returns json
language plpgsql security definer set search_path = public as $$
declare
  my_role           text;
  leader_count      integer;
  active_task_count integer;
begin
  -- Verify membership.
  select role into my_role
  from public.project_members
  where project_id = p_project_id and user_id = auth.uid();

  if my_role is null then
    return json_build_object('ok', false, 'error',
      'You are not a member of this project.');
  end if;

  -- Leaders must ensure another leader exists before leaving.
  if my_role = 'leader' then
    select count(*) into leader_count
    from public.project_members
    where project_id = p_project_id and role = 'leader';

    if leader_count <= 1 then
      return json_build_object('ok', false, 'error',
        'You are the only leader. Assign another leader before leaving.');
    end if;
  end if;

  -- Block if user has active assigned tasks.
  select count(*) into active_task_count
  from public.project_tasks
  where project_id = p_project_id
    and assigned_to = auth.uid()
    and status != 'done';

  if active_task_count > 0 then
    return json_build_object('ok', false, 'error',
      format('You have %s active task(s). Ask a Leader to reassign them before leaving.',
             active_task_count));
  end if;

  delete from public.project_members
  where project_id = p_project_id and user_id = auth.uid();

  return json_build_object('ok', true);
end;
$$;


-- ------------------------------------------------------------
-- 4. Grants
-- ------------------------------------------------------------

grant execute on function public.update_project_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.remove_project_member(uuid, uuid)            to authenticated;
grant execute on function public.leave_project(uuid)                          to authenticated;
