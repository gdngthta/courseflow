# CourseFlow — Requirements

## Functional Requirements

### Authentication ✅ (Phase 3A)
- FR-AUTH-1: Users can sign up with email and password
- FR-AUTH-2: Users can sign in and sign out
- FR-AUTH-3: Authenticated sessions persist across page reloads
- FR-AUTH-4: Unauthenticated users are redirected to /login (route protection via proxy.ts)

### Courses ✅ (Phase 3B)
- FR-COURSE-1: Users can add, edit, and archive courses
- FR-COURSE-2: Each course has a code, name, optional lecturer, optional semester, and a color tag
- FR-COURSE-3: Courses show count of active tasks and projects
- FR-COURSE-4: Courses show the next upcoming deadline
- FR-COURSE-5: Course data persists to Supabase and is scoped to the authenticated user

### Personal Tasks ✅ (Phase 3B)
- FR-TASK-1: Users can create personal tasks linked to a course
- FR-TASK-2: Personal task fields: title, course, due date, difficulty (1–5), progress (0–100%), status, notes/instructions, links, checklist
- FR-TASK-3: Users can edit and delete their own personal tasks
- FR-TASK-4: Risk status is calculated automatically
- FR-TASK-5: Task detail view shows notes/instructions, optional resource links, and an interactive checklist
- FR-TASK-6: Task data persists to Supabase (including links and checklist as JSONB)

### Group Projects ✅ (Phase 3C)
- FR-PROJ-1: Users can create a project (becomes leader automatically via create_project RPC)
- FR-PROJ-2: Project fields: name, course, deadline, optional description
- FR-PROJ-3: Leaders can invite members by email (via invite_member RPC)
- FR-PROJ-4: Roles: Leader, Admin, Member

### Project Tasks ✅ (Phase 3C)
- FR-PTASK-1: Leaders/Admins can add project tasks with: title, assigned member, due date, difficulty, notes/instructions
- FR-PTASK-2: Assigned members can update progress and status on their tasks
- FR-PTASK-3: Leaders/Admins can edit and delete project tasks
- FR-PTASK-4: Project progress = completed tasks / total tasks × 100%
- FR-PTASK-5: Task detail view shows notes/instructions (editable by leader/admin), optional resource links, and an interactive checklist
- FR-PTASK-6: Task detail notes remain visible in read-only mode for completed projects

### My Tasks (Combined View) ✅ (Phase 3D)
- FR-MYTASK-1: My Tasks shows personal tasks created by the user
- FR-MYTASK-2: My Tasks also shows group project tasks assigned to the user
- FR-MYTASK-3: Group tasks are NOT duplicated into the personal task database
- FR-MYTASK-4: My Tasks supports filtering by: All / Personal / Assigned to Me / Critical / Completed
- FR-MYTASK-5: My Tasks supports course filter dropdown

### Telegram Reminders ✅ (Phase 4.5)
- FR-REM-1: Users can save a Telegram chat ID and toggle Telegram reminders on/off
- FR-REM-2: Users can configure around-deadline and high-risk reminder toggles independently
- FR-REM-3: Users can choose a days-before window: same day, 1, 3, or 7 days before deadline
- FR-REM-4: A scheduled Vercel Cron job runs daily and sends Telegram messages for qualifying tasks
- FR-REM-5: The cron uses the Supabase service role key (server-side only) to bypass RLS for cross-user reads
- FR-REM-6: Each (user × task × reminder_type × date) is sent at most once — enforced by a unique constraint on `reminder_logs`
- FR-REM-7: A "Send Test Reminder" button lets users verify delivery from Settings
- FR-REM-8: Failed sends are logged with `status='failed'` and an error message; not retried within the same day
- FR-REM-9: Telegram bot token and CRON secret are server-side only (no `NEXT_PUBLIC_` prefix)

### Telegram Bot Assistant ✅ (Phase 4.5)
- FR-BOT-1: A webhook endpoint receives Telegram updates and identifies the CourseFlow user by `telegram_chat_id`
- FR-BOT-2: The webhook is authenticated via `X-Telegram-Bot-Api-Secret-Token` header (matched against `TELEGRAM_WEBHOOK_SECRET`)
- FR-BOT-3: The bot responds to `/help`, `/critical`, `/today`, `/upcoming`, `/closest`, `/projects` and plain-English aliases
- FR-BOT-4: Unknown messages get a fallback that lists the available commands
- FR-BOT-5: Unconnected Telegram chats receive a "not connected" reply with no data leak
- FR-BOT-6: A Telegram user can ONLY see data belonging to the profile linked to their chat ID
- FR-BOT-7: The bot uses the same `calculateRisk()` helper as the web app — risk classifications are consistent
- FR-BOT-8: Project tasks are NOT duplicated into personal tasks in any bot response (same rule as My Tasks)
- FR-BOT-9: Bot is read-only — no commands to create, edit, or delete tasks
- FR-BOT-10: No LLM / no natural language AI — exact command matching only

### Dashboard ✅ (Phase 3D)
- FR-DASH-1: Shows summary cards: Today's Tasks, Critical Tasks, Active Projects, Active Courses
- FR-DASH-2: Shows Today's Priority section (tasks due today or overdue)
- FR-DASH-3: Shows Critical Risk section (tasks with Critical status)
- FR-DASH-4: Shows Upcoming Deadlines grouped by date
- FR-DASH-5: Shows Course Overview section
- FR-DASH-6: Task cards are clickable and open Task Detail — no direct Edit/Delete on dashboard
- FR-DASH-7: Greeting shows authenticated user's first name

### Risk System ✅
- FR-RISK-1: Risk is calculated automatically (see RISK_ALGORITHM.md)
- FR-RISK-2: Risk status shows on all task cards consistently

### Calendar ✅ (Phase 3D)
- FR-CAL-1: Monthly calendar view showing personal tasks, assigned group tasks, and active project deadlines plotted by due date
- FR-CAL-2: Day cells show colored indicator pills (indigo=personal, violet=group, emerald=project deadline, red=critical); overflow shown as "+N more"
- FR-CAL-3: Today's date is highlighted with an indigo circle on the day number
- FR-CAL-4: Clicking a date selects it and shows a detail panel with Personal Tasks, Group Tasks, and Project Deadlines groups for that day
- FR-CAL-5: Sidebar shows an Upcoming Deadlines panel grouped by date (Today, Tomorrow, then by date) for all items from today onwards
- FR-CAL-6: Filters (All / Personal / Group / Critical) apply to both the calendar grid and the upcoming deadlines panel
- FR-CAL-7: Previous/Next month navigation and a "Today" shortcut button
- FR-CAL-8: Clicking a task item opens the Task Detail drawer; clicking a project deadline navigates to the Project Detail page

### Settings ✅ (Phase 3E)
- FR-SET-1: User can update profile name — persists to both Supabase `profiles` table and auth user metadata
- FR-SET-2: User can toggle light/dark theme (UI only — dark mode always on in MVP)
- FR-SET-3: User can log out (redirected to /login)

---

## Non-Functional Requirements

- NFR-1: App should load initial page in under 3 seconds on standard connection
- NFR-2: UI must work on desktop (1280px+); mobile is stretch goal
- NFR-3: All data queries must be scoped to the authenticated user
- NFR-4: No user can view or modify another user's personal tasks
- NFR-5: Project members can only see and act within projects they belong to
- NFR-6: RLS enforced at the database level — not just in UI

---

## Role-Based Access

| Action | Leader | Admin | Member |
|---|---|---|---|
| Edit project | ✅ | ❌ | ❌ |
| Delete project | ✅ | ❌ | ❌ |
| Add/remove members | ✅ | ❌ | ❌ |
| Assign admin | ✅ | ❌ | ❌ |
| Create project tasks | ✅ | ✅ | ❌ |
| Assign project tasks | ✅ | ✅ | ❌ |
| Edit project tasks | ✅ | ✅ | ❌ |
| Delete project tasks | ✅ | ✅ | ❌ |
| Update own assigned task | ✅ | ✅ | ✅ |
| View project | ✅ | ✅ | ✅ |
