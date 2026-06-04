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
| Telegram command bot (/start /critical /today /upcoming /closest /projects /help) | ✅ |
| Timezone-aware reminder send time (user-selectable, default Asia/Kuala_Lumpur) | ✅ |
| My Tasks sorted: active/critical first, completed tasks at bottom | ✅ |
| Course selector strip with consistent fixed-size cards | ✅ |
| Global topbar search (tasks / projects / courses) | ✅ |
| In-app notifications panel (derived, with localStorage dismiss) | ✅ |
| Dark + light theme toggle (persists per browser) | ✅ |
| Public landing page at `/` (hero, features, workflow, CTA) | ✅ |
| My Tasks Kanban board view (drag-drop + status select fallback) | ✅ |
| Dark-only UI (Phase 5G — light mode removed) | ✅ |
| Reopen completed project (leader only) | ✅ |
| Auto-derived task progress from checklist when present | ✅ |

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

# Any random alphanumeric string (used by Telegram webhook).
TELEGRAM_WEBHOOK_SECRET=your-webhook-secret
```

### 3. Run the database migrations

Open the Supabase SQL Editor and run, in order:

1. `supabase/schema.sql` — creates all tables, triggers, indexes, and initial RLS policies
2. `supabase/phase3c.sql` — applies SECURITY DEFINER helpers and RPCs to fix recursive RLS policies
3. `supabase/phase4.sql` — adds Telegram fields on `profiles` plus `reminder_preferences` and `reminder_logs` tables
4. `supabase/phase5.sql` — adds `profiles_insert` RLS policy + backfills profile rows for any auth users whose profile is missing (fixes FK-violation errors when creating tasks/courses/projects)
5. `supabase/phase5c.sql` — adds `'review'` to the allowed task status values on both `personal_tasks` and `project_tasks` (powers the new Kanban Review column)

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
  phase4.sql               Telegram fields + reminder_preferences + reminder_logs
  phase5.sql               profiles_insert RLS + orphan backfill
  phase5c.sql              Adds 'review' to task status check constraints
docs/                      Project documentation
scripts/                   One-off scripts (e.g. apply-theme.ps1 bulk converter)
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
1. Open [@CourseFlow_Schedule_Bot](https://t.me/CourseFlow_Schedule_Bot) on Telegram and send it any message (this is the public bot for this deployment).
2. Open [@userinfobot](https://t.me/userinfobot) and start a chat — it replies with your numeric chat ID.
3. In CourseFlow → **Settings → Reminders**, paste the chat ID, enable Telegram reminders, choose your preferences, and click **Save**.
4. Click **Send Test Reminder** to verify delivery.

> Running your own deployment? Create your own bot with [@BotFather](https://t.me/BotFather) → `/newbot`, save the token in `TELEGRAM_BOT_TOKEN`, and point users at your bot's username instead of `@CourseFlow_Schedule_Bot`.

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

## Telegram Bot Assistant

The same Telegram connection that powers scheduled reminders also exposes a **command bot**. After connecting your chat ID, message the bot with any of these commands and it replies with live data from your Supabase account:

| Command | What it shows |
|---|---|
| `/help` | List of all commands |
| `/critical` | Top 5 tasks where calculated risk is Critical |
| `/today` | Tasks due today + currently-critical tasks |
| `/upcoming` | Tasks + project deadlines grouped Today / Tomorrow / This Week |
| `/closest` | The single closest upcoming deadline (task or project) |
| `/projects` | Active projects you're a member of, with role and progress |

Plain-English aliases work too — e.g. `what is my closest deadline`, `tasks today`, `active projects`. Unknown messages get a fallback list.

**Authorization model:** a Telegram chat is linked to a CourseFlow user via `profiles.telegram_chat_id`. The webhook handler looks up the profile by chat ID and serves only that user's data. Chats not linked to any profile get a not-connected message.

**Webhook setup (production):**
1. Get your bot token from [@BotFather](https://t.me/BotFather) (same one used for reminders — one bot does both jobs).
2. Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` in Vercel.
3. Deploy. Then register the webhook with Telegram (one-time):

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://YOUR_DOMAIN/api/telegram/webhook" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

4. In Telegram, `/start` the bot ([@CourseFlow_Schedule_Bot](https://t.me/CourseFlow_Schedule_Bot) for the public deployment, or your own bot if self-hosting), get your chat ID via [@userinfobot](https://t.me/userinfobot), paste into Settings → Reminders, enable, and try `/help`.

**Local testing:** Telegram won't reach `localhost`. Use a tunnel like `ngrok http 3000` and point the webhook at `https://<ngrok-id>.ngrok.io/api/telegram/webhook`. The webhook secret check happens via the `X-Telegram-Bot-Api-Secret-Token` header — only Telegram (or someone with the secret) can hit it.

**Out of scope (honest):**
- No free-form LLM / natural language understanding — commands and exact aliases only.
- Bot is read-only. It will not create, edit, or delete tasks from chat.
- WhatsApp and n8n routing are documented as future work, not built.

---

## Architecture Highlights

**No task duplication.** Group project tasks are stored in `project_tasks` and never copied into `personal_tasks`. The My Tasks page combines them client-side using `toAllTaskCards()` — a pure derive function that reads from the already-loaded `ProjectWithRelations[]`.

**Non-recursive RLS.** Supabase RLS policies on `project_members` are backed by `SECURITY DEFINER` helper functions (`is_project_member`, `is_project_manager`, etc.) that bypass RLS internally, preventing infinite recursion in self-referential policies.

**Optimistic updates.** All mutations (create/edit/delete/checklist/mark-done) update local React state immediately, then write to Supabase. On error, `refetch()` restores the correct server state.

**Atomic project creation.** A `create_project` RPC atomically inserts both the project row and the creator's leader membership row, avoiding a race condition where the creator couldn't read their own project immediately after creation.

---

## Screenshots

Screenshots live in [`screenshots/`](screenshots/) with a per-image
checklist in [`screenshots/README.md`](screenshots/README.md). Recommended
captures: landing page, dashboard, My Tasks (list + Kanban), task detail
drawer, project detail, calendar, courses, Telegram Settings, and a real
bot conversation.

When capturing screens that may contain real data, redact the Telegram
chat ID and any user emails before committing.

---

## Demo Flow (3–5 minutes)

Use this script for a walkthrough demo:

1. **Open `/`** — the public landing page. Highlight the hero
   ("Manage personal tasks and group projects in one place"), the
   floating task cards, and the Personal vs Shared / Workflow sections.
2. **Click "Get Started"** → `/signup` → create an account (or
   "Login" if you already have one). Get bounced into `/dashboard`.
3. **Add a course** — Sidebar → Courses → "+ Add Course" (e.g.
   `WIA1005 — Network Technology`).
4. **Add a personal task** — Sidebar → My Tasks → "+ New Personal Task".
   Set it due tomorrow, attach the course you just made, mark difficulty 4.
5. **My Tasks** — the task shows on the **List view**. Toggle to
   **Board** — the same task lives in the "Not Started" column.
6. **Drag the task** from Not Started → In Progress on the Board.
   Refresh. The task stays in In Progress.
7. **Create a project** — Sidebar → Projects → "+ Create Project".
   Pick the same course. Save.
8. **Add a project task** on the Project Detail page and assign it to
   yourself.
9. **My Tasks again** — the assigned project task now appears in your
   combined task list. It was NOT duplicated into `personal_tasks`.
10. **Dashboard** — shows updated counts. "Today's Priority" and
    "Critical Risk" reflect the current task set. Notifications bell
    in the topbar shows a count.
11. **Calendar** — both the personal task and the project deadline
    appear on the correct dates.
12. **Topbar Search** — type the task title; click the result; the
    Task Detail drawer opens.
13. **Telegram** — message [@CourseFlow_Schedule_Bot](https://t.me/CourseFlow_Schedule_Bot)
    with `/closest` or `/critical`. The bot responds with live data
    from this account (chat ID must be saved in Settings → Reminders first).
14. **Scheduled reminders** — explain verbally: Vercel Cron calls
    `/api/cron/send-reminders` daily at 08:00 UTC. Each user with
    enabled preferences and qualifying tasks gets a Telegram DM;
    duplicates are blocked by a unique key on `reminder_logs`.

---

## Limitations

What the MVP intentionally does NOT do (full list in
[`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) and
[`docs/FUTURE_IMPROVEMENTS.md`](docs/FUTURE_IMPROVEMENTS.md)):

- **WhatsApp delivery** — not implemented. Telegram is the only
  out-of-app delivery channel.
- **n8n automation** — not used. The single Vercel Cron endpoint
  is the entire reminder pipeline.
- **Real-time sync** — data is fetched once on page load. Changes
  made by another team member in a shared project require a refresh.
- **Mobile layout** — targets desktop (1280px+). The sidebar
  collapses on small screens but some grid layouts may overflow.
- **Avatar upload** — initials only. Supabase Storage integration is
  deferred.
- **Project links CRUD** — the "Important Links" panel renders links
  but add/delete UI is deferred.
- **Custom per-task reminder send times** — the Settings dropdown is
  display-only. The cron runs once daily at the configured
  `vercel.json` schedule.
- **Light theme** — CourseFlow is intentionally dark-only as of
  Phase 5G. Light mode never reached an acceptable polish bar.
- **Personal project naming per member** — when User A creates a
  project under a course that User B doesn't have, User B sees the
  project under "Project course from leader" rather than mapped to
  one of their own courses. Per-member project preferences
  (`project_member_preferences`) is on the roadmap.
- **Cross-device notification dismissal** — dismiss state is per
  browser (`localStorage`). Persistent cross-device read state is
  future work.
- **Kanban drag for touch** — HTML5 native DnD is desktop-only.
  Touch devices use the "Move to" status select on each card.
- **Free-form LLM bot** — bot understands exact commands and a small
  alias map only; no natural-language AI.

---

## Future Improvements

See [`docs/FUTURE_IMPROVEMENTS.md`](docs/FUTURE_IMPROVEMENTS.md)
for the full roadmap. Highlights:

- Real-time updates via Supabase Realtime
- Avatar upload to Supabase Storage
- Project links add/delete CRUD
- Multi-channel reminder delivery (WhatsApp via Cloud API; n8n as
  a workflow router for Discord/Slack/email)
- Library-backed Kanban DnD with touch + keyboard support
- Per-project Kanban view on the Project Detail page
- Cross-device notification dismissal table

---

## Author

Built as a university coursework MVP by **gdngthta**
([github.com/gdngthta](https://github.com/gdngthta)).
