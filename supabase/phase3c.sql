-- ============================================================
-- CourseFlow — Phase 3C migration
-- Fixes recursive RLS on project_* tables and adds helper
-- functions + RPCs for project creation and member invites.
--
-- Run this in the Supabase SQL Editor AFTER schema.sql.
-- It is safe to re-run (drops are guarded with IF EXISTS).
-- ============================================================


-- ------------------------------------------------------------
-- 1. SECURITY DEFINER helpers
--    These run as the function owner and therefore BYPASS RLS,
--    which is exactly what breaks the infinite-recursion cycle
--    (a project_members policy can't query project_members
--    through RLS without recursing).
-- ------------------------------------------------------------

create or replace function public.is_project_member(pid uuid)
returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from project_members
    where project_id = pid and user_id = auth.uid()
  );
$$;

create or replace function public.is_project_manager(pid uuid)
returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from project_members
    where project_id = pid and user_id = auth.uid()
      and role in ('leader', 'admin')
  );
$$;

create or replace function public.is_project_leader(pid uuid)
returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from project_members
    where project_id = pid and user_id = auth.uid()
      and role = 'leader'
  );
$$;

-- Does the current user share at least one project with the given user?
-- Used so project members can see each other's profile (name/email).
create or replace function public.shares_project_with(uid uuid)
returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1
    from project_members pm_self
    join project_members pm_other on pm_self.project_id = pm_other.project_id
    where pm_self.user_id = auth.uid()
      and pm_other.user_id = uid
  );
$$;


-- ------------------------------------------------------------
-- 2. Drop the old (recursive) policies
-- ------------------------------------------------------------

-- profiles
drop policy if exists "profiles: own read"        on public.profiles;

-- projects
drop policy if exists "projects: members read"    on public.projects;
drop policy if exists "projects: leader update"   on public.projects;
drop policy if exists "projects: authenticated insert" on public.projects;

-- project_members
drop policy if exists "project_members: members read"  on public.project_members;
drop policy if exists "project_members: leader insert" on public.project_members;
drop policy if exists "project_members: leader update" on public.project_members;
drop policy if exists "project_members: leader delete" on public.project_members;

-- project_tasks
drop policy if exists "project_tasks: members read"             on public.project_tasks;
drop policy if exists "project_tasks: leader/admin insert"      on public.project_tasks;
drop policy if exists "project_tasks: leader/admin/assignee update" on public.project_tasks;
drop policy if exists "project_tasks: leader/admin delete"      on public.project_tasks;

-- project_links
drop policy if exists "project_links: members read"        on public.project_links;
drop policy if exists "project_links: leader/admin insert"  on public.project_links;
drop policy if exists "project_links: leader/admin delete"  on public.project_links;


-- ------------------------------------------------------------
-- 3. Recreate non-recursive policies using the helpers
-- ------------------------------------------------------------

-- profiles: own row, plus profiles of people you share a project with
create policy "profiles_select" on public.profiles for select
  using (auth.uid() = id or shares_project_with(id));

-- projects
create policy "projects_select" on public.projects for select
  using (is_project_member(id) or auth.uid() = created_by);

create policy "projects_insert" on public.projects for insert
  with check (auth.uid() = created_by);

create policy "projects_update" on public.projects for update
  using (is_project_leader(id));

-- project_members
create policy "members_select" on public.project_members for select
  using (is_project_member(project_id));

create policy "members_insert" on public.project_members for insert
  with check (is_project_leader(project_id) or auth.uid() = user_id);

create policy "members_update" on public.project_members for update
  using (is_project_leader(project_id));

create policy "members_delete" on public.project_members for delete
  using (is_project_leader(project_id));

-- project_tasks
create policy "tasks_select" on public.project_tasks for select
  using (is_project_member(project_id));

create policy "tasks_insert" on public.project_tasks for insert
  with check (is_project_manager(project_id));

create policy "tasks_update" on public.project_tasks for update
  using (is_project_manager(project_id) or auth.uid() = assigned_to);

create policy "tasks_delete" on public.project_tasks for delete
  using (is_project_manager(project_id));

-- project_links
create policy "links_select" on public.project_links for select
  using (is_project_member(project_id));

create policy "links_insert" on public.project_links for insert
  with check (is_project_manager(project_id));

create policy "links_delete" on public.project_links for delete
  using (is_project_manager(project_id));


-- ------------------------------------------------------------
-- 4. RPC: create a project + add creator as leader (atomic)
--    SECURITY DEFINER so both inserts happen without tripping
--    the chicken-and-egg of the SELECT-after-insert RLS check.
-- ------------------------------------------------------------

create or replace function public.create_project(
  p_name        text,
  p_course_id   uuid,
  p_deadline    date,
  p_description text default null
)
returns public.projects
language plpgsql security definer set search_path = public as $$
declare
  new_project public.projects;
begin
  insert into public.projects (name, course_id, deadline, description, created_by, status)
  values (p_name, p_course_id, p_deadline, p_description, auth.uid(), 'active')
  returning * into new_project;

  insert into public.project_members (project_id, user_id, role)
  values (new_project.id, auth.uid(), 'leader');

  return new_project;
end;
$$;


-- ------------------------------------------------------------
-- 5. RPC: invite a member by email
--    Looks up the profile by email (bypassing profiles RLS)
--    and inserts a membership row if the caller is the leader.
-- ------------------------------------------------------------

create or replace function public.invite_member(
  p_project_id uuid,
  p_email      text,
  p_role       text default 'member'
)
returns json
language plpgsql security definer set search_path = public as $$
declare
  target_id uuid;
begin
  if not is_project_leader(p_project_id) then
    return json_build_object('ok', false, 'error', 'Only the project leader can invite members.');
  end if;

  select id into target_id
  from public.profiles
  where lower(email) = lower(p_email)
  limit 1;

  if target_id is null then
    return json_build_object('ok', false, 'error', 'No CourseFlow user found with that email. Ask them to sign up first.');
  end if;

  if exists (
    select 1 from public.project_members
    where project_id = p_project_id and user_id = target_id
  ) then
    return json_build_object('ok', false, 'error', 'That user is already a member of this project.');
  end if;

  insert into public.project_members (project_id, user_id, role)
  values (p_project_id, target_id, p_role);

  return json_build_object('ok', true);
end;
$$;


-- ------------------------------------------------------------
-- 6. Grants — allow the authenticated role to call the RPCs
-- ------------------------------------------------------------

grant execute on function public.create_project(text, uuid, date, text) to authenticated;
grant execute on function public.invite_member(uuid, text, text)        to authenticated;
grant execute on function public.is_project_member(uuid)  to authenticated;
grant execute on function public.is_project_manager(uuid) to authenticated;
grant execute on function public.is_project_leader(uuid)  to authenticated;
grant execute on function public.shares_project_with(uuid) to authenticated;
