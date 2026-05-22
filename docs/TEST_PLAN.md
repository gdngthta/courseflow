# CourseFlow — Test Plan

> This is the test plan for the one-week MVP. Testing strategy is pragmatic: manual testing for all user flows, with unit tests for critical logic.

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

### Auth
- [ ] Sign up with new email → lands on dashboard
- [ ] Sign in with existing credentials → lands on dashboard
- [ ] Invalid credentials → shows error
- [ ] Sign out → redirected to login
- [ ] Access protected page without auth → redirected to login

### Courses
- [ ] Add a course → appears in course list
- [ ] Edit a course → changes reflected in list and dropdowns
- [ ] Archive a course → moves to Archived tab
- [ ] Course appears in task/project course dropdowns

### Personal Tasks
- [ ] Create personal task → appears in My Tasks
- [ ] Edit task → fields updated correctly
- [ ] Delete task → removed from My Tasks (with confirmation)
- [ ] Update progress → risk status recalculates
- [ ] Mark as Done → status changes, risk shows Completed
- [ ] Filter by course → shows only matching tasks
- [ ] Filter tabs (All / Personal / Critical / Completed) work correctly

### Projects
- [ ] Create project → appears in project list, creator is Leader
- [ ] Invite member by email → member appears in project
- [ ] Add project task + assign → task appears in assigned member's My Tasks
- [ ] Assigned member updates task progress → project progress updates
- [ ] Leader edits project task → changes reflected
- [ ] Leader deletes project task → removed from project and member's My Tasks
- [ ] Member cannot delete task
- [ ] Project progress = completed / total × 100

### Dashboard
- [ ] Summary cards show correct counts
- [ ] Today's Priority shows tasks due today
- [ ] Critical Risk shows critical tasks only
- [ ] Upcoming Deadlines shows future tasks sorted by date
- [ ] Clicking task card opens Task Detail
- [ ] Completed tasks do not appear in Critical Risk

### Task Detail
- [ ] Shows correct task data
- [ ] Progress can be updated
- [ ] Status can be changed
- [ ] Edit button opens edit form (leader/admin for group tasks)
- [ ] Delete button shows confirmation modal
- [ ] Member sees Edit/Delete disabled for group tasks they don't own

---

## Edge Cases to Verify

- My Tasks page with no personal tasks and no assigned group tasks shows empty state
- Project with no tasks shows 0% progress
- Task with due_date in the past shows Critical (unless Done)
- Creating a personal task without a course — should be allowed
- Archiving a course does not delete its tasks or projects
