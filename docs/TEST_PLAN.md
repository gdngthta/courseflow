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
- [ ] Settings → Reminders shows "Not connected" pill when chat ID is empty
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
