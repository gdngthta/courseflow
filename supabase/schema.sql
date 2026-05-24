-- ============================================================
-- CourseFlow — Supabase Database Schema
-- Phase 3: Auth + Persistence
--
-- Run this in the Supabase SQL Editor (or via CLI migrations).
-- Sections:
--   1. Helper functions + triggers
--   2. Tables
--   3. Row Level Security (RLS)
--   4. Indexes
-- ============================================================


-- ============================================================
-- 1. HELPER FUNCTIONS + TRIGGERS
-- ============================================================

-- updated_at auto-stamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Auto-create a profile row when a new auth user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;


-- ============================================================
-- 2. TABLES
-- ============================================================

-- ── profiles ──────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Trigger: create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ── courses ───────────────────────────────────────────────────
create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  code        text not null,
  name        text not null,
  lecturer    text,
  semester    text,
  color       text not null default '#6366f1',
  is_archived boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger courses_updated_at
  before update on public.courses
  for each row execute function update_updated_at();


-- ── personal_tasks ────────────────────────────────────────────
create table if not exists public.personal_tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  course_id   uuid references public.courses(id) on delete set null,
  title       text not null,
  notes       text,
  due_date    date not null,
  status      text not null default 'not_started'
                check (status in ('not_started', 'in_progress', 'done')),
  progress    integer not null default 0
                check (progress >= 0 and progress <= 100),
  difficulty  integer not null default 3
                check (difficulty >= 1 and difficulty <= 5),
  checklist   jsonb not null default '[]'::jsonb,
  links       jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger personal_tasks_updated_at
  before update on public.personal_tasks
  for each row execute function update_updated_at();


-- ── projects ──────────────────────────────────────────────────
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid references public.courses(id) on delete set null,
  name         text not null,
  description  text,
  deadline     date not null,
  status       text not null default 'active'
                 check (status in ('active', 'completed')),
  completed_at timestamptz,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger projects_updated_at
  before update on public.projects
  for each row execute function update_updated_at();


-- ── project_members ───────────────────────────────────────────
create table if not exists public.project_members (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        text not null default 'member'
                check (role in ('leader', 'admin', 'member')),
  joined_at   timestamptz not null default now(),
  unique (project_id, user_id)
);


-- ── project_tasks ─────────────────────────────────────────────
create table if not exists public.project_tasks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by  uuid references public.profiles(id) on delete set null,
  title       text not null,
  notes       text,
  due_date    date not null,
  status      text not null default 'not_started'
                check (status in ('not_started', 'in_progress', 'done')),
  progress    integer not null default 0
                check (progress >= 0 and progress <= 100),
  difficulty  integer not null default 3
                check (difficulty >= 1 and difficulty <= 5),
  checklist   jsonb not null default '[]'::jsonb,
  links       jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger project_tasks_updated_at
  before update on public.project_tasks
  for each row execute function update_updated_at();


-- ── project_links ─────────────────────────────────────────────
create table if not exists public.project_links (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  label       text not null,
  url         text not null,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);


-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.profiles        enable row level security;
alter table public.courses         enable row level security;
alter table public.personal_tasks  enable row level security;
alter table public.projects        enable row level security;
alter table public.project_members enable row level security;
alter table public.project_tasks   enable row level security;
alter table public.project_links   enable row level security;


-- ── profiles policies ─────────────────────────────────────────
create policy "profiles: own read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: own update"
  on public.profiles for update
  using (auth.uid() = id);


-- ── courses policies ──────────────────────────────────────────
create policy "courses: own select"
  on public.courses for select
  using (auth.uid() = user_id);

create policy "courses: own insert"
  on public.courses for insert
  with check (auth.uid() = user_id);

create policy "courses: own update"
  on public.courses for update
  using (auth.uid() = user_id);

create policy "courses: own delete"
  on public.courses for delete
  using (auth.uid() = user_id);


-- ── personal_tasks policies ───────────────────────────────────
create policy "personal_tasks: own select"
  on public.personal_tasks for select
  using (auth.uid() = user_id);

create policy "personal_tasks: own insert"
  on public.personal_tasks for insert
  with check (auth.uid() = user_id);

create policy "personal_tasks: own update"
  on public.personal_tasks for update
  using (auth.uid() = user_id);

create policy "personal_tasks: own delete"
  on public.personal_tasks for delete
  using (auth.uid() = user_id);


-- ── projects policies ─────────────────────────────────────────
-- Any project member can read the project
create policy "projects: members read"
  on public.projects for select
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = projects.id
        and project_members.user_id = auth.uid()
    )
  );

-- Only the leader can update/complete the project
create policy "projects: leader update"
  on public.projects for update
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = projects.id
        and project_members.user_id = auth.uid()
        and project_members.role = 'leader'
    )
  );

-- Any authenticated user can create a project (they become the leader in the same tx)
create policy "projects: authenticated insert"
  on public.projects for insert
  with check (auth.uid() = created_by);


-- ── project_members policies ──────────────────────────────────
-- Members can see who else is in their projects
create policy "project_members: members read"
  on public.project_members for select
  using (
    exists (
      select 1 from public.project_members as pm
      where pm.project_id = project_members.project_id
        and pm.user_id = auth.uid()
    )
  );

-- Leader can add members
create policy "project_members: leader insert"
  on public.project_members for insert
  with check (
    exists (
      select 1 from public.project_members as pm
      where pm.project_id = project_members.project_id
        and pm.user_id = auth.uid()
        and pm.role = 'leader'
    )
    -- Allow the creator to add themselves as the first member
    or auth.uid() = user_id
  );

-- Leader can update/remove members
create policy "project_members: leader update"
  on public.project_members for update
  using (
    exists (
      select 1 from public.project_members as pm
      where pm.project_id = project_members.project_id
        and pm.user_id = auth.uid()
        and pm.role = 'leader'
    )
  );

create policy "project_members: leader delete"
  on public.project_members for delete
  using (
    exists (
      select 1 from public.project_members as pm
      where pm.project_id = project_members.project_id
        and pm.user_id = auth.uid()
        and pm.role = 'leader'
    )
  );


-- ── project_tasks policies ────────────────────────────────────
-- Any project member can read tasks
create policy "project_tasks: members read"
  on public.project_tasks for select
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = project_tasks.project_id
        and project_members.user_id = auth.uid()
    )
  );

-- Leader or admin can create tasks
create policy "project_tasks: leader/admin insert"
  on public.project_tasks for insert
  with check (
    exists (
      select 1 from public.project_members
      where project_members.project_id = project_tasks.project_id
        and project_members.user_id = auth.uid()
        and project_members.role in ('leader', 'admin')
    )
  );

-- Leader/admin can update any task; assigned member can update their own task
create policy "project_tasks: leader/admin/assignee update"
  on public.project_tasks for update
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = project_tasks.project_id
        and project_members.user_id = auth.uid()
        and project_members.role in ('leader', 'admin')
    )
    or auth.uid() = project_tasks.assigned_to
  );

-- Leader or admin can delete tasks
create policy "project_tasks: leader/admin delete"
  on public.project_tasks for delete
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = project_tasks.project_id
        and project_members.user_id = auth.uid()
        and project_members.role in ('leader', 'admin')
    )
  );


-- ── project_links policies ────────────────────────────────────
-- Any member can read links
create policy "project_links: members read"
  on public.project_links for select
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = project_links.project_id
        and project_members.user_id = auth.uid()
    )
  );

-- Leader or admin can manage links
create policy "project_links: leader/admin insert"
  on public.project_links for insert
  with check (
    exists (
      select 1 from public.project_members
      where project_members.project_id = project_links.project_id
        and project_members.user_id = auth.uid()
        and project_members.role in ('leader', 'admin')
    )
  );

create policy "project_links: leader/admin delete"
  on public.project_links for delete
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = project_links.project_id
        and project_members.user_id = auth.uid()
        and project_members.role in ('leader', 'admin')
    )
  );


-- ============================================================
-- 4. INDEXES
-- ============================================================

create index if not exists idx_courses_user_id          on public.courses(user_id);
create index if not exists idx_personal_tasks_user_id   on public.personal_tasks(user_id);
create index if not exists idx_personal_tasks_course_id on public.personal_tasks(course_id);
create index if not exists idx_projects_course_id       on public.projects(course_id);
create index if not exists idx_projects_created_by      on public.projects(created_by);
create index if not exists idx_project_members_project  on public.project_members(project_id);
create index if not exists idx_project_members_user     on public.project_members(user_id);
create index if not exists idx_project_tasks_project    on public.project_tasks(project_id);
create index if not exists idx_project_tasks_assigned   on public.project_tasks(assigned_to);
create index if not exists idx_project_links_project    on public.project_links(project_id);
