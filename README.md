# CourseFlow

**CourseFlow** is a student productivity web app that combines personal coursework task management and shared group project task management into one dashboard.

> Built with Next.js 16, TypeScript, Tailwind CSS v4, and Supabase.

---

## The Problem

Students manage personal assignments and group project responsibilities in separate tools. This causes missed deadlines, unclear accountability, and poor visibility of project progress.

## The Solution

CourseFlow combines both into one place. When a group project task is assigned to a student, it automatically appears in that student's **My Tasks** page — without duplicating data.

---

## Features

| Feature | Status |
|---|---|
| App shell (sidebar + topbar) | ✅ |
| Risk algorithm | ✅ |
| Dashboard — priority, risk, deadlines, course overview | ✅ |
| My Tasks — tabs, filters, create/edit/delete, task detail | ✅ |
| Projects list + Create Project modal | ✅ |
| Project Detail — tasks, members, links, progress | ✅ |
| Courses management — add/edit/archive | ✅ |
| Calendar — monthly view, task/deadline plotting, filters | ✅ |
| Settings — profile, preferences, sign out | ✅ |
| Form validation, empty states | ✅ |
| Supabase DB schema + RLS | ✅ |
| Auth (signup, login, session, route protection) | ✅ |
| All data persisted to Supabase (real data, no mock) | ✅ |
| Profile name save to Supabase | ✅ |
| Telegram scheduled reminders (around-deadline + high-risk) | ✅ |

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Backend/Auth/DB**: Supabase (PostgreSQL + Auth + RLS)
- **Icons**: lucide-react

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd courseflow
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in:

```
# From Supabase → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Service role key (same page in Supabase). Server-side ONLY.
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# For Telegram reminders (optional — leave blank to disable the feature locally).
# Get a bot token from @BotFather on Telegram.
TELEGRAM_BOT_TOKEN=your-bot-token
# Any long random string. Vercel Cron sends this as a Bearer token.
CRON_SECRET=your-long-random-string
```

### 3. Run the database migrations

Open the Supabase SQL Editor and run, in order:

1. `supabase/schema.sql` — creates all tables, triggers, indexes, and initial RLS policies
2. `supabase/phase3c.sql` — applies SECURITY DEFINER helpers and RPCs to fix recursive RLS policies
3. `supabase/phase4.sql` — adds Telegram fields on `profiles` plus `reminder_preferences` and `reminder_logs` tables

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up and start adding courses and tasks.

---

## Project Structure

```
src/
  app/
    (auth)/login/          Login page
    (auth)/signup/         Signup page
    (app)/                 App shell (sidebar + topbar, auth-protected)
      dashboard/
      tasks/
      projects/[id]/
      courses/
      calendar/
      settings/
  components/
    layout/                Sidebar, Topbar
    ui/                    Badge, Button, ProgressBar, Modal, EmptyState, Input, ConfirmModal
    tasks/                 TaskCard, TaskDetailModal, TaskFormModal
    projects/              InviteMemberModal
    courses/               CourseCard, CourseFormModal
    brand/                 OwlMascot
  contexts/
    AuthContext.tsx        Supabase auth state (user, loading, signOut)
    DataContext.tsx        All app data (courses, tasks, projects) + mutations
  lib/
    supabase.ts            Supabase browser client factory
    risk.ts                Risk status calculation
    taskDerive.ts          Pure helpers: personalTaskToCard, toAllTaskCards, buildMemberNameMap
    projectDerive.ts       Pure helpers: toProjectCards, toProjectDetail, toAssignedTaskCards
    api/                   Supabase query modules (courses, personalTasks, projects, profiles...)
  proxy.ts                 Next.js 16 route protection (replaces middleware.ts)
  types/index.ts           Shared TypeScript types
supabase/
  schema.sql               Full initial schema
  phase3c.sql              RLS fix migration (SECURITY DEFINER helpers + RPCs)
docs/                      Project documentation
```

---

## Documentation

- [Project Overview](docs/PROJECT_OVERVIEW.md)
- [Requirements](docs/REQUIREMENTS.md)
- [System Design](docs/SYSTEM_DESIGN.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [Risk Algorithm](docs/RISK_ALGORITHM.md)
- [Test Plan](docs/TEST_PLAN.md)
- [Future Improvements](docs/FUTURE_IMPROVEMENTS.md)

---

## Telegram Reminders

CourseFlow can send a Telegram message when a deadline is around the corner or a task becomes high-risk.

**Per-user setup:**
1. Talk to [@BotFather](https://t.me/BotFather) on Telegram → `/newbot` → save the token in `TELEGRAM_BOT_TOKEN`.
2. Start a chat with the bot, then forward any of its messages to [@userinfobot](https://t.me/userinfobot) to get your numeric chat ID.
3. In CourseFlow → **Settings → Reminders**, paste the chat ID, enable Telegram reminders, choose your preferences, and click **Save**.
4. Click **Send Test Reminder** to verify delivery.

**Scheduled sends (production):**
- Deploy to Vercel. Set `TELEGRAM_BOT_TOKEN`, `CRON_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` in the Vercel project's env vars.
- `vercel.json` schedules `GET /api/cron/send-reminders` at `0 8 * * *` (08:00 UTC daily). Vercel automatically attaches `Authorization: Bearer $CRON_SECRET`.
- The cron job checks each opted-in user's tasks, finds reminder candidates (around-deadline + high-risk), and sends one Telegram message per (user × task × reminder_type × day). Duplicates are prevented by a unique constraint on `reminder_logs`.

**Local manual test:**
```bash
curl -X GET http://localhost:3000/api/cron/send-reminders \
  -H "Authorization: Bearer $CRON_SECRET"
```
Returns a JSON summary: `{ users_checked, candidates_found, sent, skipped_duplicate, failed }`.

**Limitations (honest):**
- The cron runs once daily. The "Preferred send time" field in Settings is display-only.
- Failed sends are logged but **not retried** — the unique-key slot is claimed for the day to avoid retry storms. Fix the chat ID; tomorrow's run will send again.
- WhatsApp delivery is not implemented (see `docs/FUTURE_IMPROVEMENTS.md`).
- n8n / message queues are not used; the single Vercel Cron endpoint is the entire delivery pipeline.

---

## Architecture Highlights

**No task duplication.** Group project tasks are stored in `project_tasks` and never copied into `personal_tasks`. The My Tasks page combines them client-side using `toAllTaskCards()` — a pure derive function that reads from the already-loaded `ProjectWithRelations[]`.

**Non-recursive RLS.** Supabase RLS policies on `project_members` are backed by `SECURITY DEFINER` helper functions (`is_project_member`, `is_project_manager`, etc.) that bypass RLS internally, preventing infinite recursion in self-referential policies.

**Optimistic updates.** All mutations (create/edit/delete/checklist/mark-done) update local React state immediately, then write to Supabase. On error, `refetch()` restores the correct server state.

**Atomic project creation.** A `create_project` RPC atomically inserts both the project row and the creator's leader membership row, avoiding a race condition where the creator couldn't read their own project immediately after creation.
