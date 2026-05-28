-- ============================================================
-- CourseFlow — Phase 4 migration
-- Adds Telegram reminder support:
--   • telegram_chat_id + telegram_enabled on profiles
--   • reminder_preferences table (one row per user)
--   • reminder_logs table (audit trail + duplicate prevention)
--
-- Run this in the Supabase SQL Editor AFTER schema.sql and phase3c.sql.
-- Safe to re-run (uses IF NOT EXISTS / DROP IF EXISTS).
-- ============================================================


-- ------------------------------------------------------------
-- 1. Profile columns for Telegram delivery
-- ------------------------------------------------------------

alter table public.profiles
  add column if not exists telegram_chat_id text,
  add column if not exists telegram_enabled boolean not null default false;


-- ------------------------------------------------------------
-- 2. reminder_preferences
--    One row per user, holds toggles and timing prefs.
--    Upserted from the Settings UI.
-- ------------------------------------------------------------

create table if not exists public.reminder_preferences (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null unique references public.profiles(id) on delete cascade,
  enabled                  boolean not null default true,
  around_deadline_enabled  boolean not null default true,
  high_risk_enabled        boolean not null default true,
  days_before              integer not null default 1 check (days_before in (0, 1, 3, 7)),
  send_time                text    not null default '08:00',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

drop trigger if exists reminder_preferences_updated_at on public.reminder_preferences;
create trigger reminder_preferences_updated_at
  before update on public.reminder_preferences
  for each row execute function update_updated_at();


-- ------------------------------------------------------------
-- 3. reminder_logs
--    One row per send attempt. The composite UNIQUE constraint
--    is the duplicate-prevention mechanism: the cron job tries
--    to insert before sending, and a unique-violation means
--    "already sent today, skip."
-- ------------------------------------------------------------

create table if not exists public.reminder_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  task_type      text not null check (task_type in ('personal', 'project')),
  task_id        uuid not null,
  reminder_type  text not null check (reminder_type in ('around_deadline', 'high_risk')),
  sent_to        text not null,
  sent_date      date not null default current_date,
  sent_at        timestamptz not null default now(),
  status         text not null check (status in ('sent', 'failed')),
  error_message  text,
  unique (user_id, task_type, task_id, reminder_type, sent_date)
);

create index if not exists reminder_logs_user_date_idx
  on public.reminder_logs (user_id, sent_date desc);


-- ------------------------------------------------------------
-- 4. Row Level Security
--    Users can read & manage their own preferences.
--    Users can read their own logs (read-only — logs are
--    inserted exclusively by the cron job using the service
--    role key, which bypasses RLS).
-- ------------------------------------------------------------

alter table public.reminder_preferences enable row level security;
alter table public.reminder_logs        enable row level security;

drop policy if exists "reminder_prefs_select" on public.reminder_preferences;
drop policy if exists "reminder_prefs_insert" on public.reminder_preferences;
drop policy if exists "reminder_prefs_update" on public.reminder_preferences;

create policy "reminder_prefs_select" on public.reminder_preferences for select
  using (auth.uid() = user_id);

create policy "reminder_prefs_insert" on public.reminder_preferences for insert
  with check (auth.uid() = user_id);

create policy "reminder_prefs_update" on public.reminder_preferences for update
  using (auth.uid() = user_id);

drop policy if exists "reminder_logs_select" on public.reminder_logs;

create policy "reminder_logs_select" on public.reminder_logs for select
  using (auth.uid() = user_id);

-- Intentionally NO insert/update/delete policies for reminder_logs.
-- The cron job uses the service role, which bypasses RLS.
-- The UI is read-only against this table.
