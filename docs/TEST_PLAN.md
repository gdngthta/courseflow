# CourseFlow — Test Plan

> Testing strategy: manual testing for all user flows, unit tests for critical logic.

---

## Unit Tests

### Risk Algorithm (`src/lib/risk.ts`)

| Test Case | Input | Expected Output |
|---|---|---|
| Done task | status=done | completed |
| Overdue task | due=yesterday, status=in_progress | critical |
| Due today, low progress | due=today, progress=20 | critical |
| Due in 2 days, low progress | days=2, progress=40 | critical |
| Due in 5 days, low progress | days=5, progress=40 | warning |
| High difficulty, low progress | difficulty=5, progress=20, days=10 | warning |
| On track | days=14, progress=60, difficulty=3 | safe |

---

## Manual Test Flows

### Auth (Phase 3A)
- [ ] Sign up with new email → lands on dashboard, greeting shows first name
- [ ] Sign in with existing credentials → lands on dashboard
- [ ] Invalid credentials → shows inline error message
- [ ] Sign out from sidebar or Settings → redirected to /login
- [ ] Access /dashboard without auth → redirected to /login
- [ ] Access /login while logged in → redirected to /dashboard

### Courses (Phase 3B)
- [ ] Add a course → appears in course list immediately (optimistic)
- [ ] Edit a course → changes reflected in list and all course dropdowns
- [ ] Archive a course → moves to Archived tab; disappears from task/project dropdowns
- [ ] Unarchive a course → returns to Active tab
- [ ] Course persists after page refresh (Supabase)

### Personal Tasks (Phase 3B)
- [ ] Create personal task → appears in My Tasks immediately
- [ ] Edit task → fields updated correctly
- [ ] Delete task → removed from My Tasks, Dashboard, Calendar (with confirmation)
- [ ] Update progress → risk status recalculates correctly
- [ ] Mark as Done → status changes, risk shows Completed; hidden from calendar
- [ ] Filter by course → shows only matching tasks
- [ ] Filter tabs (All / Personal / Critical / Completed) work correctly
- [ ] Task with links → links show in Task Detail drawer
- [ ] Task with checklist → checklist toggles persist after closing and reopening drawer
- [ ] Task data persists after page refresh (Supabase)

### Projects (Phase 3C)
- [ ] Create project → appears in project list, creator is Leader
- [ ] Invite member by email → member appears in project members list
- [ ] Invite non-existent email → shows "No CourseFlow user found with that email"
- [ ] Invite already-a-member → shows "already a member" error
- [ ] Add project task + assign → task appears in assigned member's My Tasks
- [ ] Assigned member updates task progress → project progress bar updates
- [ ] Leader edits project task → changes reflected across all views
- [ ] Leader deletes project task → removed from project and member's My Tasks
- [ ] Member cannot add/edit/delete tasks (buttons hidden)
- [ ] Project progress = completed / total × 100%
- [ ] Complete project → moves to Completed tab, tasks become read-only
- [ ] Project data persists after page refresh (Supabase)

### My Tasks — Combined View (Phase 3D)
- [ ] Personal tasks and assigned group tasks both appear in All tab
- [ ] Personal tab → only personal tasks
- [ ] Assigned to Me tab → only group project tasks assigned to current user
- [ ] Critical tab → only tasks with critical risk
- [ ] Completed tab → only done tasks
- [ ] Search by title → filters correctly
- [ ] Course dropdown filter → shows only tasks from selected course
- [ ] Marking a group task done via My Tasks → updates project progress

### Dashboard (Phase 3D)
- [ ] Greeting shows authenticated user's first name
- [ ] Summary cards show correct real counts (not mock data)
- [ ] Today's Priority shows tasks due today or overdue
- [ ] Critical Risk shows critical tasks only
- [ ] Upcoming Deadlines grouped by date, future tasks only
- [ ] Course Overview shows real courses with real task counts
- [ ] Clicking task card opens Task Detail modal
- [ ] Owl mascot shows "thinking" variant when critical tasks exist
- [ ] Creating a task on My Tasks → immediately reflected on Dashboard without refresh

### Calendar (Phase 3D)
- [ ] Monthly grid renders 42 cells (6 rows × 7 columns) starting on Sunday
- [ ] Today's date shows indigo circle on the day number
- [ ] Tasks appear as colored pills on their due dates (indigo=personal, violet=group, red=critical)
- [ ] Project deadlines appear as emerald pills (All filter)
- [ ] Clicking a date selects it and updates the right-side detail panel
- [ ] Detail panel groups items into Personal Tasks / Group Tasks / Project Deadlines
- [ ] Upcoming Deadlines sidebar shows Today / Tomorrow / dated groups correctly
- [ ] Filter tabs (All / Personal / Group / Critical) apply to grid and sidebar
- [ ] Previous/Next month navigation; "Today" button resets to current month
- [ ] "+N more" overflow label appears when a day has more than 3 items
- [ ] Clicking a task pill opens the Task Detail drawer
- [ ] Clicking a project deadline pill navigates to /projects/[id]
- [ ] Done tasks do NOT appear on the calendar

### Settings (Phase 3E)
- [ ] Profile section shows authenticated user's name from Supabase
- [ ] Editing first/last name and saving → updates greeting on Dashboard and sidebar immediately (auth metadata updated)
- [ ] Save button shows "Saving…" while in flight, then "✓ Saved"
- [ ] Error during save → shows inline error message
- [ ] Sign Out in Account section → redirects to /login

---

## Edge Cases

- My Tasks page with no personal tasks and no assigned group tasks → shows empty state
- Project with no tasks → shows 0% progress
- Task with due_date in the past → shows Critical risk (unless Done)
- Creating a personal task without a course → should be allowed ("No course" label)
- Archiving a course does not delete its tasks or projects — they remain in DB
- Creating a task then immediately refreshing → task still appears (Supabase persistence)
- Calendar date rendering uses local time (not UTC) — tasks appear on the correct local day

---

## Phase 1 UX Polish — Manual Checks

### Form Validation
- [ ] Creating a task with an empty title shows "Task title is required" error
- [ ] Creating a task without a due date shows "Due date is required" error
- [ ] Adding a resource link with URL not starting with http:// or https:// shows inline error
- [ ] Fixing the URL clears the error immediately

### Non-Functional UI
- [ ] Topbar search input is disabled with tooltip
- [ ] Topbar theme toggle and notifications buttons are disabled (tooltip on hover)
- [ ] Settings avatar camera button is disabled with tooltip

### Empty States
- [ ] Courses > Archived tab with no archived courses → "No archived courses" (no Add button)
- [ ] Projects > Completed tab with no completed projects → "No completed projects yet"
- [ ] Projects > Active tab with no active projects → "No projects yet" with Create action

### Invite Member Modal
- [ ] Submitting invite shows success screen with the invited email
- [ ] Error from RPC (user not found, already a member) shows inline error
- [ ] Modal resets to form when reopened

### Phase 5G — Product Logic + UX Correction
- [ ] Dashboard → Today's Priority shows an overdue task, a critical task with a far-future due date, a due-today task, a due-tomorrow task, a task ≤3 days out with <50% progress, and a difficulty-5 task ≤7 days out
- [ ] Dashboard Today's Priority heading ⓘ tooltip explains the rule set
- [ ] Toggling a checklist item updates the task progress visually AND persists (refresh, progress unchanged from derived value)
- [ ] Creating a task with no checklist still lets you set progress manually
- [ ] Marking a task Done via Task Detail → revert it back to Review / In Progress / Not Started via the same dropdown
- [ ] Same revert works via the Kanban "Move to" select
- [ ] Project leader sees a "Reopen project" button on the green completed banner; clicking it moves the project back to Active, clears completed_at
- [ ] Non-leaders do NOT see the reopen button
- [ ] Project Detail shows roles as Leader / Editor / Viewer (not Leader/Admin/Member)
- [ ] Invite Member modal role dropdown reads Viewer / Editor
- [ ] Add Project Task modal blocks submit when no assignee selected with error "Please assign this task to a member."
- [ ] Project Detail task cards show "Assigned to {name}" line
- [ ] Course card shows X to do / X/Y stats and (when applicable) "N due this week" amber callout
- [ ] Project card shows Total / Done / To do stats and "N assigned to you" line
- [ ] Calendar has Month + Year selects above the grid; selecting jumps the view
- [ ] Signup with a password containing a space → "Password cannot contain spaces."
- [ ] Login with a password containing a space → same error (consistent)
- [ ] Signup with name "123 Smith" or "Smith42" → "Name can only contain letters, spaces, apostrophes, and hyphens."
- [ ] Settings → Profile name save with invalid name → same error inline; valid name saves with no JSON / parsing error
- [ ] Topbar Sun/Moon toggle is gone; Settings tabs are only Profile / Reminders / Account
- [ ] Hard refresh on any page → no flash of light theme

### Kanban Board (Phase 5C)
- [ ] My Tasks shows a List / Board toggle in the filter row
- [ ] Default view is List; selecting Board shows 4 columns
- [ ] Board has columns: Not Started, In Progress, Review, Done
- [ ] Existing personal tasks appear in the correct column based on `status`
- [ ] Existing assigned project tasks appear in the correct column based on `status`
- [ ] Editing a task and choosing "Review" in the status dropdown persists, and the task moves to the Review column
- [ ] Drag a personal task from Not Started → In Progress: column updates immediately, persists after refresh, dashboard "today" count updates if it was overdue/critical
- [ ] Drag an assigned project task to Done: project progress on the project detail page increases, calendar pill is hidden (done tasks excluded), persists after refresh
- [ ] "Move to" select on a card updates status without dragging (touch-friendly)
- [ ] Active tab filters work on the board (Personal → only personal tasks visible across all 4 columns, etc.)
- [ ] Course filter works on the board (only that course's tasks visible)
- [ ] Search filter works on the board
- [ ] Tasks under a completed project show a lock icon, no drag handle, no status select (read-only)
- [ ] Clicking a kanban card opens the existing Task Detail drawer with full content
- [ ] Empty columns show "No tasks here."
- [ ] Board is readable in both dark and light themes
- [ ] On screens narrower than 4 columns the board scrolls horizontally with snap-to-column

### App Shell — Topbar, Search, Notifications, Theme (Phase 5A)
- [ ] Topbar search dropdown opens on focus / typing ≥ 2 chars
- [ ] Search returns matches across Tasks, Projects, Courses sections; per-group cap of 5
- [ ] Clicking a personal-task result opens the Task Detail drawer with full content
- [ ] Clicking a project-task result opens the Task Detail drawer with full content
- [ ] Clicking a project result routes to /projects/[id]
- [ ] Clicking a course result routes to /courses
- [ ] Escape / click-outside closes the dropdown
- [ ] Bell badge shows a count when there are non-dismissed urgent items
- [ ] Bell panel lists notifications grouped/labelled by type with the right icon and color
- [ ] Clicking a critical / overdue / due-today / due-tomorrow personal-task notification opens the Task Detail drawer
- [ ] Clicking a project-task notification opens the Task Detail drawer
- [ ] Clicking a project-deadline notification navigates to /projects/[id]
- [ ] Clicking a notification for a task that no longer exists shows an inline red error in the panel (not an empty drawer)
- [ ] Dismiss-individual removes the notification and decrements the badge
- [ ] Dismiss-all removes everything from the panel and clears the badge
- [ ] Dismissed state survives a refresh on the same browser
- [ ] Dismissed state does NOT carry across browsers (documented limitation)
- [ ] Theme toggle button in topbar switches dark ↔ light immediately
- [ ] Settings → Preferences theme dropdown reflects current theme and offers System
- [ ] Choosing System tracks OS dark-mode preference and reacts to OS changes
- [ ] Theme survives a refresh in the same browser
- [ ] No flash of wrong-theme content on initial load
- [ ] Project Detail "Add member" button opens the Add Member by Email modal; modal title reads "Add Member by Email"
- [ ] Settings → Profile shows initials avatar only (no disabled camera button)

### Telegram Bot Assistant (Phase 4.5)
- [ ] POST `/api/telegram/webhook` without the secret header → 401 Unauthorized (when `TELEGRAM_WEBHOOK_SECRET` is set)
- [ ] POST `/api/telegram/webhook` with the secret header but a chat_id NOT linked to any profile → bot DMs "Your Telegram is not connected to CourseFlow yet."
- [ ] Connected user messages `/help` → bot replies with the 6-command list
- [ ] Connected user messages `/critical` → bot returns up to 5 tasks where `calculateRisk()` is `critical`, sorted by nearest due_date, including the "Closest deadline" summary line
- [ ] Connected user with NO critical tasks messages `/critical` → bot replies "No critical tasks right now."
- [ ] Connected user messages `/today` → bot returns tasks due today + critical tasks, sorted critical-first, with a "Focus first" suggestion
- [ ] Connected user messages `/upcoming` → bot groups items under "Today", "Tomorrow", "This Week"
- [ ] Connected user messages `/closest` → bot returns the single nearest deadline (task or project), with a tailored next-action sentence
- [ ] Connected user messages `/projects` → bot returns active projects only, with role and progress
- [ ] Project tasks under a *completed* project do NOT appear in any bot response
- [ ] Aliases work: `what should i do today`, `closest deadline`, `active projects`, `critical tasks`
- [ ] Unknown text → bot replies with the fallback command-list message
- [ ] Connected user A's data is NEVER returned to connected user B's chat (chat_id mapping is the only auth)
- [ ] Disabling `telegram_enabled` on the profile → bot replies "not connected" until re-enabled

### Telegram Reminders (Phase 4.5)
> Public bot for this deployment: **@CourseFlow_Schedule_Bot** ([t.me/CourseFlow_Schedule_Bot](https://t.me/CourseFlow_Schedule_Bot)).
> Get the chat ID via **@userinfobot** ([t.me/userinfobot](https://t.me/userinfobot)). The bot username is shown to users only — internally the app routes by `TELEGRAM_BOT_TOKEN` + numeric `telegram_chat_id`.

- [ ] Settings → Reminders shows "Not connected" pill when chat ID is empty
- [ ] Settings → Reminders helper text links to @CourseFlow_Schedule_Bot and @userinfobot
- [ ] Saving a chat ID and toggling "Enable Telegram reminders" → "Telegram connected" pill turns green
- [ ] Send Test Reminder → message arrives in Telegram chat with "🦉 CourseFlow Test" header
- [ ] Send Test Reminder with no chat ID → 400 error displayed inline
- [ ] Save Reminder Settings → toggles and days-before persist across page refresh
- [ ] Manual cron call: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/send-reminders` returns summary JSON
- [ ] Cron call with wrong/missing Bearer token → 401 Unauthorized
- [ ] After creating a task due tomorrow with `days_before=1` enabled → cron call sends a Telegram message
- [ ] Calling the cron a second time the same day → summary shows `skipped_duplicate > 0`, no second message arrives
- [ ] Settings → Recent Reminders list shows the sent message with status `sent`
- [ ] Disabling `enabled` in reminder_preferences → next cron call skips the user
- [ ] Marking the reminded task as done → cron no longer sends for it

### Cross-Page State (Supabase persistence)
- [ ] Creating a personal task on My Tasks → appears on Dashboard and Calendar
- [ ] Archiving a course → disappears from task/project course dropdowns immediately
- [ ] Marking a task done → task disappears from calendar and critical risk section
- [ ] All changes above survive a full page refresh

### Phase 6G — Timezone-aware Reminders + My Tasks Polish

#### Reminder timezone and send time
- [ ] Settings → Reminders → Reminder Preferences: "Send time (local)" field is editable (type="time")
- [ ] Settings → Reminders → Reminder Preferences: "Timezone" select shows common IANA zones, defaults to Asia/Kuala_Lumpur
- [ ] Helper text below the timezone selector shows "Daily reminders are sent around [selected time] ([timezone label])."
- [ ] Save settings → reload page → send time and timezone persist (fetched from reminder_preferences)
- [ ] Info callout no longer says "Fixed at 08:00 UTC"; says "CourseFlow checks reminders regularly and sends them around your selected local time."
- [ ] Manual cron trigger during user's local send hour → reminder arrives
- [ ] Manual cron trigger outside user's local send hour → summary shows `users_skipped_time > 0`, no message sent
- [ ] Calling cron a second time within the same send hour → `skipped_duplicate` prevents second message
- [ ] Set timezone to Asia/Kuala_Lumpur + send_time 08:00 → cron at UTC 00:00 sends (KL is UTC+8)

#### Course cards layout (My Tasks)
- [ ] All course cards are the same width (240px) regardless of course name length
- [ ] All course cards are the same height (128px) regardless of number of stat lines shown
- [ ] Long course names are truncated with ellipsis — do not expand card height
- [ ] "All Courses" card matches the visual style of course cards
- [ ] Archive toggle button sits inline with the card row, vertically centred
- [ ] At 1366×768, the card row scrolls horizontally without wrapping

#### Task sorting
- [ ] My Tasks → All tab: critical/overdue tasks appear at top, done tasks at bottom
- [ ] My Tasks → Personal tab: same sort order
- [ ] My Tasks → Assigned tab: same sort order
- [ ] My Tasks → Critical tab: no done tasks are shown
- [ ] My Tasks → Completed tab: only done tasks, no re-sort applied
- [ ] Dashboard → Critical Risk section: no done tasks appear
- [ ] Creating a task, marking it done, going back to All tab: done task is at the bottom

### Phase 6C.2 — Project Member Management

#### Role change
- [ ] Leader opens Project Detail → Members panel shows each member's role badge
- [ ] Leader sees shield/eye action icon beside each Editor/Viewer (not beside other leaders)
- [ ] Clicking eye icon on an Editor → role changes to Viewer (badge updates)
- [ ] Clicking shield icon on a Viewer → role changes to Editor (badge updates)
- [ ] Leader cannot see role-change actions beside their own row
- [ ] If role change fails (RPC error), inline error shown in panel

#### Remove member
- [ ] Leader clicks remove (UserMinus) icon → confirm modal appears
- [ ] Confirm modal describes the member and warns about data loss
- [ ] Member has active tasks: remove is blocked by RPC; error shown after dismiss
- [ ] Member has no active tasks: removed successfully; member list updates
- [ ] Cannot remove the only leader — RPC returns error, shown inline
- [ ] Removed member no longer sees the project after refresh
- [ ] Removed member's assigned tasks no longer appear in My Tasks

#### Leave project
- [ ] Viewer/Editor sees "Leave project" link at bottom of Members panel
- [ ] Clicking → confirm modal appears
- [ ] Confirm → if user has active tasks, RPC returns error, shown inline
- [ ] Confirm → if no active tasks, user is removed; project disappears from their Projects list
- [ ] Leader does not see "Leave project" link (they must transfer leadership first)
- [ ] Only leader trying to leave → RPC returns "only leader" error

#### In-app notification (member added)
- [ ] User B is added to a project by User A
- [ ] User B refreshes → notification bell shows "Added to project" notification
- [ ] Notification reads: `Added to "[Project Name]"` with subtitle `You joined as Viewer`
- [ ] Clicking notification → navigates to /projects/[id]
- [ ] After 7 days the notification no longer appears (derived from joined_at)
- [ ] Notification can be dismissed; dismissed state persists in localStorage
