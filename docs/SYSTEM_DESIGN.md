# CourseFlow — System Design

## Architecture Overview

CourseFlow is a full-stack web application using:
- **Next.js 16** (App Router) for the frontend and routing
- **Supabase** for authentication, database (PostgreSQL), and row-level security
- **Tailwind CSS v4** for styling

```
Browser
  └─ Next.js App (React, App Router)
       ├─ Client Components (interactive UI, data mutations)
       ├─ proxy.ts (route protection — replaces Next.js middleware.ts)
       ├─ Supabase Browser Client (@supabase/ssr)
       │    └─ Supabase (PostgreSQL + Auth + RLS + SECURITY DEFINER RPCs)
       └─ Server-only API routes (Node runtime)
            ├─ /api/cron/send-reminders ← Vercel Cron (daily 08:00 UTC)
            └─ /api/telegram/test       ← user-initiated test send
                  ├─ Supabase Admin Client (service role key — bypasses RLS)
                  └─ Telegram Bot API (https://api.telegram.org)
```

### Telegram Bot Pipeline (inbound)

```
User → Telegram chat → /critical
       ↓
Telegram → POST /api/telegram/webhook   (X-Telegram-Bot-Api-Secret-Token)
       ├─ Verify secret header
       ├─ Extract chat_id + message text
       ├─ findProfileByChatId(chat_id)
       │     └─ no match? → reply "not connected", stop
       ├─ parseCommand(text)  ← exact-match alias parser, NO LLM
       ├─ Dispatch (one of):
       │     ├─ fetchCombinedIncompleteTasks(profile.id) → format
       │     └─ fetchActiveProjects(profile.id)          → format
       └─ sendTelegramMessage(chat_id, reply)
```

Authorization model: the `profiles.telegram_chat_id` mapping IS the
authorization. The webhook never trusts any field from Telegram other
than `chat.id`, and it serves only data scoped to that profile's user_id.

### Telegram Reminder Pipeline (outbound, scheduled)

```
Vercel Cron (08:00 UTC)
  → GET /api/cron/send-reminders   (Bearer CRON_SECRET)
       ├─ Load profiles WHERE telegram_enabled AND chat_id IS NOT NULL
       ├─ For each user with reminder_preferences.enabled:
       │     ├─ Load incomplete personal_tasks
       │     ├─ Load incomplete assigned project_tasks
       │     ├─ findReminderCandidates(tasks, prefs)  ← pure function
       │     ├─ For each candidate:
       │     │     1. INSERT reminder_logs (status='sent')
       │     │        └─ unique-violation? → skip (dedupe)
       │     │     2. generateReminderMessage(candidate) ← pure function
       │     │     3. sendTelegramMessage(chat_id, text)
       │     │     4. If send failed → UPDATE log to status='failed'
       └─ Return summary JSON
```

## Route Structure

```
/                          → public landing page (Phase 5B; no auth required)
/(auth)/login              → login page
/(auth)/signup             → signup page
/(app)/dashboard           → dashboard (app shell)
/(app)/tasks               → my tasks
/(app)/projects            → projects list
/(app)/projects/[id]       → project detail
/(app)/courses             → course management
/(app)/calendar            → calendar view
/(app)/settings            → settings

/api/cron/send-reminders   → Vercel-cron Telegram dispatcher (Bearer CRON_SECRET)
/api/telegram/test         → user-initiated test Telegram send
/api/telegram/webhook      → Telegram bot webhook (X-Telegram-Bot-Api-Secret-Token)
```

`/` lives at the app root and is NOT inside the (app) route group, so it
does not mount AuthProvider/DataProvider. proxy.ts treats it as public —
only the routes in PROTECTED_PATHS require an authenticated session.

## Component Structure

```
components/
  layout/
    Sidebar.tsx            Fixed left nav (240px) — reads user from AuthContext
    Topbar.tsx             Fixed top bar with page title
  ui/
    Badge.tsx              RiskBadge, StatusBadge, TypeBadge, RoleBadge
    Button.tsx             Primary, Secondary, Destructive, Ghost
    ProgressBar.tsx        Visual progress indicator
    Modal.tsx              Reusable modal wrapper
    EmptyState.tsx         Empty state placeholders
    Input.tsx              Styled input + label
    SelectInput.tsx        Styled select + label
    ConfirmModal.tsx       Generic confirmation modal
  tasks/
    TaskCard.tsx           Task card (Dashboard, My Tasks, Calendar)
    TaskDetailModal.tsx    Task detail drawer
    TaskFormModal.tsx      Create/edit personal task
  projects/
    ProjectCard.tsx        Project card (Projects list)
    InviteMemberModal.tsx  Invite member by email
  courses/
    CourseCard.tsx         Course card
    CourseFormModal.tsx    Add/edit course
  brand/
    OwlMascot.tsx          Owl SVG mascot (Dashboard tip card)
```

## Data Flow — Auth & Session

```
proxy.ts (Next.js 16 middleware)
  └─ Reads Supabase session cookie on every request
       ├─ No session → redirect to /login
       └─ Auth pages while logged in → redirect to /dashboard

AuthContext (client-side)
  └─ onAuthStateChange listener → { user, loading, signOut }
       └─ User object read by: Sidebar, Settings, Dashboard greeting
```

## Data Flow — All Data (DataContext)

```
DataContext mounts on app load (inside AuthProvider)
  └─ Triggers on userId change (auth state)
       ├─ fetchCourses()      → courses[]
       ├─ fetchPersonalTasks() → personalTasks[]
       └─ fetchProjects()     → ProjectWithRelations[]
            └─ nested Supabase select:
                 projects + courses + project_members + profiles
                          + project_tasks + project_links

Exposed mutations (all optimistic — local state first, DB second):
  Courses:       addCourse, updateCourse, setCourseArchived
  PersonalTasks: addPersonalTask, updatePersonalTask, deletePersonalTask,
                 markPersonalTaskDone, updatePersonalTaskChecklist
  Projects:      createProject (via RPC), completeProject,
                 addProjectTask, updateProjectTask, deleteProjectTask,
                 markProjectTaskDone, updateProjectTaskNotes,
                 updateProjectTaskChecklist, inviteMember (via RPC)
```

## Data Flow — My Tasks

```
My Tasks page
  useMemo → toAllTaskCards(personalTasks, courses, projects, userId)
    ├─ personalTasks.map(t → personalTaskToCard(t, courses))
    └─ toAssignedTaskCards(projects, userId)
         └─ project_tasks WHERE assigned_to === userId
              (derived from ProjectWithRelations[], no extra query)

Both result sets normalised into TaskCardData[] rendered by TaskCard.
NO data is copied between tables.
```

## Data Flow — Calendar

```
Calendar page
  useMemo → toAllTaskCards(...)  → allTasks
  useMemo → toProjectCards(...)  → allProjects

  filter: status !== 'done'  → activeTasks
  filter: status === 'active' → activeProjects

  Filter tab (All / Personal / Group / Critical) → filteredTasks

  itemsByDate: Record<YYYY-MM-DD, CalendarItem[]>
    ├─ filteredTasks grouped by task.due_date (string key, no UTC conversion)
    └─ activeProjects grouped by p.deadline (All filter only)

  CalendarItem union type:
    | { kind: 'task';    data: TaskCardData }
    | { kind: 'project'; id, name, courseCode, deadline }

  getCalendarDays(year, month) → 42 Date cells (6 rows × 7 cols, Sunday start)
  toDateKey(date) → YYYY-MM-DD string (local time, avoids UTC offset issues)
```

## Data Flow — Risk Calculation

Risk is calculated entirely on the client side using `src/lib/risk.ts`.

Input: `{ status, due_date, progress, difficulty }`
Output: `'safe' | 'warning' | 'critical' | 'completed'`

The same function is used everywhere: Dashboard, My Tasks, Project Detail, Calendar.

## State Management

### Phase 3+ — Supabase (current)

All entity state lives in two React Contexts:

```
AuthProvider  (contexts/AuthContext.tsx)
  └─ { user, loading, signOut }  ← Supabase Auth

DataProvider  (contexts/DataContext.tsx)
  └─ { userId, courses, personalTasks, projects, loading, error, ... }
       ├─ Pure derive functions (useMemo, no extra fetch):
       │    toAllTaskCards, toProjectCards, toProjectDetail,
       │    toAssignedTaskCards, buildMemberNameMap
       └─ Mutations update local state optimistically, then write to Supabase
```

Mounted in `(app)/layout.tsx`:
```tsx
<AuthProvider>
  <DataProvider>
    {children}
  </DataProvider>
</AuthProvider>
```

## Database RPCs (SECURITY DEFINER)

Two stored procedures bypass RLS for atomic or privileged operations:

| RPC | Purpose |
|---|---|
| `create_project(name, course_id, deadline, description)` | Atomically inserts project + leader membership row |
| `invite_member(project_id, email, role)` | Looks up profile by email (bypasses profiles RLS), inserts membership |

Helper functions (internal, SECURITY DEFINER):

| Function | Purpose |
|---|---|
| `is_project_member(pid, uid)` | Returns true if uid is in project_members for pid |
| `is_project_manager(pid, uid)` | Returns true if uid is leader or admin |
| `is_project_leader(pid, uid)` | Returns true if uid is leader |
| `shares_project_with(uid)` | Returns true if current_user shares any project with uid |

These prevent infinite recursion in self-referential RLS policies.

## Security

- Supabase Row Level Security (RLS) enforces data ownership at the database level
- Users can only read/write rows they own or belong to
- Project role checks are enforced in both RLS policies and UI
- `SECURITY DEFINER` functions run with elevated privileges only for the specific atomic operations that require it
- `.env.local` contains real Supabase credentials and is gitignored — never committed
