-- ============================================================
-- CourseFlow — Phase 5 migration
-- Profile consistency fix.
--
-- Problem:
--   `personal_tasks.user_id`, `courses.user_id`, etc. all reference
--   `profiles(id)`. A profile row is supposed to be auto-created by
--   the `handle_new_user` trigger on `auth.users` insert. But:
--     1. There is no `profiles_insert` RLS policy, so the app cannot
--        fall back to creating the row itself if the trigger missed.
--     2. Any auth.users row that exists from before the trigger was
--        installed (or for which the trigger silently failed) has
--        no matching profile row → every downstream insert fails
--        with a foreign-key violation.
--
-- This migration:
--   1. Adds a `profiles_insert` RLS policy so an authenticated user
--      can create their own profile row.
--   2. Backfills profile rows for every auth.users row that doesn't
--      already have one. Idempotent — safe to re-run.
--
-- Run AFTER schema.sql + phase3c.sql + phase4.sql.
-- ============================================================


-- ------------------------------------------------------------
-- 1. RLS: let users create their own profile row
-- ------------------------------------------------------------
-- The trigger normally beats us to it (SECURITY DEFINER bypasses RLS),
-- but the app's ensureProfile() needs this policy as a fallback path
-- when the trigger missed.

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles for insert
  with check (auth.uid() = id);


-- ------------------------------------------------------------
-- 2. Backfill orphaned auth users
-- ------------------------------------------------------------
-- Insert a profile row for every auth.users row that lacks one.
-- Uses `on conflict do nothing` so re-running is safe.

insert into public.profiles (id, email, full_name)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
