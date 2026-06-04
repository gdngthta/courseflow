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
- FR-PROJ-3: Leaders can add members by email (via invite_member RPC). Member must have an existing CourseFlow account. No email is sent.
- FR-PROJ-4: Roles: Leader (DB: leader) / Editor (DB: admin) / Viewer (DB: member)
- FR-PROJ-5: Leader can change a member's role between Editor and Viewer (update_project_member_role RPC). Cannot change another leader's role.
- FR-PROJ-6: Leader can remove an Editor or Viewer (remove_project_member RPC). Blocked if target has active assigned tasks. Cannot remove the only leader.
- FR-PROJ-7: Editor and Viewer can leave a project (leave_project RPC). Blocked if user has active assigned tasks. Leader cannot leave if they are the only leader.
- FR-PROJ-8: Removed/left members immediately lose access to the project and their assigned tasks are no longer shown in My Tasks.
- FR-PROJ-9: In-app notification appears when a user is added to a project within the last 7 days (derived from project_members.joined_at, shown in notifications panel for 7 days).

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

### Telegram Reminders ✅ (Phase 4.5 + Phase 6G)
- FR-REM-1: Users can save a Telegram chat ID and toggle Telegram reminders on/off
- FR-REM-2: Users can configure around-deadline and high-risk reminder toggles independently
- FR-REM-3: Users can choose a days-before window: same day, 1, 3, or 7 days before deadline
- FR-REM-4: A scheduled Vercel Cron job runs **once daily at 22:00 UTC** (`0 22 * * *`), which is 06:00 AM Malaysia time. Vercel Hobby plan only allows once-per-day crons.
- FR-REM-5: The cron uses the Supabase service role key (server-side only) to bypass RLS for cross-user reads
- FR-REM-6: Each (user × task × reminder_type × date) is sent at most once — enforced by a unique constraint on `reminder_logs`
- FR-REM-7: A "Send Test Reminder" button lets users verify delivery from Settings
- FR-REM-8: Failed sends are logged with `status='failed'` and an error message; not retried within the same day
- FR-REM-9: Telegram bot token and CRON secret are server-side only (no `NEXT_PUBLIC_` prefix)
- FR-REM-10: Reminder send time is fixed at **06:00 AM Malaysia time (22:00 UTC)** on the Hobby deployment. Timezone customization is not supported — all enabled users are processed at the same cron firing.
- FR-REM-11: `TELEGRAM_WEBHOOK_SECRET` is required in production. The webhook returns 401 if the secret header is missing or incorrect.

### My Tasks Layout + Sorting ✅ (Phase 6G)
- FR-TASKS-1: My Tasks course selector shows fixed-size cards (240×128px) so all cards are uniform regardless of course name length.
- FR-TASKS-2: Course card strip is horizontally scrollable. Long course names truncate with ellipsis.
- FR-TASKS-3: On the All, Personal, and Assigned tabs, tasks are sorted: critical first → overdue → nearest due date → difficulty; completed tasks always appear at the bottom.
- FR-TASKS-4: On the Critical tab, completed tasks are excluded (a done task cannot be critical, but the guard is explicit).
- FR-TASKS-5: Dashboard Critical Risk section excludes completed tasks defensively.

### Phase 5G — Product Logic + UX Correction
- FR-5G-1: Today's Priority on Dashboard includes overdue tasks, Critical-risk tasks (any due date), due-today, due-tomorrow, ≤3 days with progress<50%, and difficulty 4–5 ≤7 days. Heading has a tooltip explaining the rules.
- FR-5G-2: When a task has a checklist, its `progress` is automatically derived (completed items ÷ total items × 100) and persisted to Supabase whenever a checklist item is toggled. Manual progress slider only applies to tasks without a checklist.
- FR-5G-3: Difficulty helper text shown under the Difficulty select on TaskFormModal and AddProjectTaskModal: "Difficulty increases risk when progress is low and the deadline is close."
- FR-5G-4: Dashboard task click opens the same Task Detail drawer used on My Tasks (no extra navigation).
- FR-5G-5: Kanban card click anywhere opens the Task Detail drawer; the GripVertical icon signals draggability; HTML5 native drag still works.
- FR-5G-6: Task status can be reverted from Done back to Review / In Progress / Not Started via the Task Detail status dropdown OR the Kanban "Move to" select.
- FR-5G-7: Project leader can reopen a completed project. `status` flips back to `active` and `completed_at` is cleared. Only the leader sees the button.
- FR-5G-8: Project roles are displayed as Leader / Editor / Viewer in the UI. The database still stores `leader / admin / member` because RLS helpers depend on those exact strings.
- FR-5G-9: New project tasks require an `assigned_to` value before submission.
- FR-5G-10: Project task cards in Project Detail show "Assigned to: {name}".
- FR-5G-11: Course cards show task totals: incomplete / total / completed, plus an "X due this week" amber callout. Counts personal tasks + project tasks assigned to the viewer.
- FR-5G-12: Project cards show 3-stat strip (Total / Done / To do) plus an "N assigned to you" line.
- FR-5G-13: Archived course does not delete its tasks and does not auto-complete them. Tasks remain accessible.
- FR-5G-14: Completed project does not auto-change task statuses. Tasks become read-only on the Kanban (lock icon).
- FR-5G-15: A user can be invited to a project whose course they don't have; the shared project remains accessible. Per-member course personalisation is future work.
- FR-5G-16: Calendar has month and year quick-jump selects in the controls row (in addition to prev/next/Today).
- FR-5G-17: Password validation rejects whitespace anywhere ("Password cannot contain spaces."). Consistent across Signup, Login, and (eventually) password-change flows.
- FR-5G-18: Full-name validation allows letters / spaces / apostrophes / hyphens only; must start with a letter. Applied at Signup and Settings.
- FR-5G-19: `updateMyProfile` strips undefined fields and trims string inputs; `handleSave` in Settings explicitly checks the `auth.updateUser` return for errors (previously swallowed).
- FR-5G-20: In-app notifications are derived live from current Supabase data on every render: overdue, critical, due_today, due_tomorrow, project_deadline ≤7 days. Notification id encodes type+entity+date so dismissal is per-occurrence; localStorage carries dismiss state per browser.
- FR-5G-21: App is dark-only. ThemeProvider is a stub that always sets `dark` on `<html>`; the topbar/landing toggle and Settings theme dropdown are removed.

### Kanban Board View ✅ (Phase 5C)
- FR-KANBAN-1: My Tasks page has a List / Board view toggle in the filter row; defaults to List
- FR-KANBAN-2: Board View shows the same combined task data (personal + assigned project tasks) — project tasks are NOT duplicated into `personal_tasks`
- FR-KANBAN-3: Board has four columns: Not Started, In Progress, Review, Done
- FR-KANBAN-4: `'review'` is a real persisted status (added by `supabase/phase5c.sql` to the check constraints on both `personal_tasks` and `project_tasks`; added to `TaskStatus` union, status badge, and TaskFormModal dropdown)
- FR-KANBAN-5: Status changes from the board persist to Supabase via existing `updatePersonalTask` / `updateProjectTask` paths and update Dashboard / Calendar / project progress accordingly
- FR-KANBAN-6: Two interaction modes — HTML5 native drag-and-drop on desktop, and a per-card "Move to" status select for touch / accessibility (no new npm dependency)
- FR-KANBAN-7: Tasks under a completed project are rendered read-only (no drag handle, no status select, lock icon shown)
- FR-KANBAN-8: Existing My Tasks filters (All / Personal / Assigned / Critical / Completed + course filter + search) apply unchanged to Board View
- FR-KANBAN-9: Empty columns show "No tasks here."
- FR-KANBAN-10: Clicking a Kanban card opens the existing Task Detail drawer (no separate drawer)

### Public Landing Page ✅ (Phase 5B)
- FR-LANDING-1: `/` is a public route accessible without authentication; no redirect to `/dashboard`
- FR-LANDING-2: Protected app routes (`/dashboard`, `/tasks`, `/projects`, `/courses`, `/calendar`, `/settings`) remain proxy-protected — unauthenticated requests are redirected to `/login`
- FR-LANDING-3: Landing page composes a navbar, hero with floating decorative cards, features grid, personal-vs-shared explainer, workflow stages, final CTA, and footer
- FR-LANDING-4: "Get Started" CTA links to `/signup`; "Login" links to `/login`; authenticated users hitting `/login` or `/signup` are redirected to `/dashboard` by the proxy
- FR-LANDING-5: Animations are CSS-only (`@keyframes cf-fade-up`, `cf-float`); disabled automatically when `prefers-reduced-motion: reduce` is set
- FR-LANDING-6: Landing page respects the user's dark/light theme via the same `ThemeContext` used by the app
- FR-LANDING-7: Workflow section is honest: `Review` status is labelled "Coming with Kanban" since the underlying schema still only supports `not_started | in_progress | done`

### App Shell — Topbar / Search / Notifications / Theme ✅ (Phase 5A)
- FR-SHELL-1: Global search in the topbar runs over personal tasks, assigned project tasks, projects, and courses with a grouped dropdown of results
- FR-SHELL-2: Task search results open the Task Detail drawer; project results route to /projects/[id]; course results route to /courses
- FR-SHELL-3: Notification bell shows an unread count (derived live from current Supabase data — overdue, critical, due-today, due-tomorrow, project-deadline within 7 days)
- FR-SHELL-4: Per task, only the highest-priority notification type is emitted (overdue > critical > due_today > due_tomorrow) to avoid duplicate rows
- FR-SHELL-5: Project-deadline notifications skip projects whose tasks are all done (100% progress) to avoid nagging on effectively-completed work
- FR-SHELL-6: Clicking a notification re-derives a fresh TaskCardData from current data and opens the drawer (no stale cached references); shows an inline error if the entity no longer exists
- FR-SHELL-7: Notifications can be dismissed individually or all at once; dismiss state is stored in localStorage (per browser) and pruned after 30 days
- FR-SHELL-8: Theme toggle in the topbar switches between dark and light; the Settings → Preferences dropdown adds a "System" option that follows the OS preference and reacts to its changes
- FR-SHELL-9: Theme preference is persisted under `courseflow:theme` in localStorage and applied via an inline `<head>` script before hydration to avoid flash of wrong theme
- FR-SHELL-10: Adding a member to a project goes via email lookup of an existing CourseFlow account (label "Add Member by Email" / "Add member"); no email is sent, so the UI does not claim it is

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

### Mobile Responsive Support ✅ (Phase 6H)
- FR-MOB-1: App is usable on mobile (360–430px), tablet (768px), and desktop (1366px+)
- FR-MOB-2: Sidebar collapses into a slide-in drawer on mobile; hamburger button in Topbar toggles it
- FR-MOB-3: Overlay backdrop closes the mobile drawer; nav item taps also close it
- FR-MOB-4: Topbar is full-width on mobile (left-0) and sidebar-offset on lg+ (left-60)
- FR-MOB-5: Global search is an icon on mobile that opens a full-screen search overlay
- FR-MOB-6: Notifications panel is full-width on mobile, 22rem dropdown on sm+
- FR-MOB-7: Task Detail drawer is full-screen on mobile (inset-0), right-side panel on sm+
- FR-MOB-8: Modal base component is a bottom sheet on mobile, centred dialog on sm+
- FR-MOB-9: Calendar stacks to single-column on mobile; calendar cells show dots only on mobile, full pills on sm+
- FR-MOB-10: Settings section nav is a horizontal tab strip on mobile, vertical nav on sm+
- FR-MOB-11: Landing navbar shows hamburger on mobile with full-width dropdown sheet
- FR-MOB-12: Kanban uses horizontal scroll with fixed-width (w-72) columns; "Move to" status dropdown works on touch
- FR-MOB-13: All pages use p-4 sm:p-6 padding; no accidental horizontal overflow
- FR-MOB-14: Course selector strip is horizontally scrollable on mobile with scrollbar-none
- FR-MOB-15: html/body overflow-x: hidden prevents accidental horizontal page scroll

---

## Non-Functional Requirements

- NFR-1: App should load initial page in under 3 seconds on standard connection
- NFR-2: UI works on mobile (360px+), tablet (768px), and desktop (1280px+)
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
