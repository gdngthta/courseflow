-- ============================================================
-- Phase 6G — Timezone-aware reminder send time
-- ============================================================
-- Run this once against your Supabase project to add the
-- timezone column to reminder_preferences.
-- The cron now runs hourly and checks each user's local time
-- against their saved send_time before sending reminders.
-- ============================================================

alter table public.reminder_preferences
  add column if not exists timezone text not null default 'Asia/Kuala_Lumpur';
