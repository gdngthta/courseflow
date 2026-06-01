-- ============================================================
-- CourseFlow — Phase 5C migration
-- Adds 'review' to the allowed task status values.
--
-- Was:  status in ('not_started', 'in_progress', 'done')
-- Now:  status in ('not_started', 'in_progress', 'review', 'done')
--
-- Applies to both personal_tasks and project_tasks. Existing rows
-- are unaffected — the new value is additive, no data backfill
-- needed. Safe to re-run.
--
-- Run AFTER schema.sql + phase3c.sql + phase4.sql + phase5.sql.
-- ============================================================


-- ------------------------------------------------------------
-- 1. personal_tasks: replace the status check constraint
-- ------------------------------------------------------------
-- The constraint is defined inline in schema.sql with the implicit
-- name 'personal_tasks_status_check'. We drop the old one and
-- recreate with the expanded value list.

alter table public.personal_tasks
  drop constraint if exists personal_tasks_status_check;

alter table public.personal_tasks
  add constraint personal_tasks_status_check
  check (status in ('not_started', 'in_progress', 'review', 'done'));


-- ------------------------------------------------------------
-- 2. project_tasks: same change
-- ------------------------------------------------------------

alter table public.project_tasks
  drop constraint if exists project_tasks_status_check;

alter table public.project_tasks
  add constraint project_tasks_status_check
  check (status in ('not_started', 'in_progress', 'review', 'done'));
