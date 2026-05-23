# CourseFlow — Requirements

## Functional Requirements

### Authentication
- FR-AUTH-1: Users can sign up with email and password
- FR-AUTH-2: Users can sign in and sign out
- FR-AUTH-3: Authenticated sessions persist across page reloads

### Courses
- FR-COURSE-1: Users can add, edit, and archive courses
- FR-COURSE-2: Each course has a code, name, optional lecturer, optional semester, and a color tag
- FR-COURSE-3: Courses show count of active tasks and projects
- FR-COURSE-4: Courses show the next upcoming deadline

### Personal Tasks
- FR-TASK-1: Users can create personal tasks linked to a course
- FR-TASK-2: Personal task fields: title, course, due date, difficulty (1–5), progress (0–100%), status, notes/instructions
- FR-TASK-3: Users can edit and delete their own personal tasks
- FR-TASK-4: Risk status is calculated automatically
- FR-TASK-5: Task detail view shows notes/instructions, optional resource links, and an interactive checklist

### Group Projects
- FR-PROJ-1: Users can create a project (becomes leader automatically)
- FR-PROJ-2: Project fields: name, course, deadline, optional description
- FR-PROJ-3: Leaders can invite members by email, assign admin role
- FR-PROJ-4: Roles: Leader, Admin, Member

### Project Tasks
- FR-PTASK-1: Leaders/Admins can add project tasks with: title, assigned member, due date, difficulty, notes/instructions
- FR-PTASK-2: Assigned members can update progress and status on their tasks
- FR-PTASK-3: Leaders/Admins can edit and delete project tasks
- FR-PTASK-4: Project progress = completed tasks / total tasks × 100%
- FR-PTASK-5: Task detail view shows notes/instructions (editable by leader/admin), optional resource links, and an interactive checklist
- FR-PTASK-6: Task detail notes remain visible in read-only mode for completed projects

### My Tasks (Combined View)
- FR-MYTASK-1: My Tasks shows personal tasks created by the user
- FR-MYTASK-2: My Tasks also shows group project tasks assigned to the user
- FR-MYTASK-3: Group tasks are NOT duplicated into the personal task database
- FR-MYTASK-4: My Tasks supports filtering by: All / Personal / Assigned to Me / Critical / Completed
- FR-MYTASK-5: My Tasks supports course filter dropdown

### Dashboard
- FR-DASH-1: Shows summary cards: Today's Tasks, Critical Tasks, Active Projects, Active Courses
- FR-DASH-2: Shows Today's Priority section (tasks due today or imminently)
- FR-DASH-3: Shows Critical Risk section (tasks with Critical status)
- FR-DASH-4: Shows Upcoming Deadlines grouped by date
- FR-DASH-5: Shows Course Overview section
- FR-DASH-6: Task cards are clickable and open Task Detail — no direct Edit/Delete on dashboard

### Risk System
- FR-RISK-1: Risk is calculated automatically (see RISK_ALGORITHM.md)
- FR-RISK-2: Risk status shows on all task cards consistently

### Calendar
- FR-CAL-1: Monthly calendar view showing personal tasks, assigned group tasks, and active project deadlines plotted by due date
- FR-CAL-2: Day cells show colored indicator pills (indigo=personal, violet=group, emerald=project deadline, red=critical); overflow shown as "+N more"
- FR-CAL-3: Today's date is highlighted with an indigo circle on the day number
- FR-CAL-4: Clicking a date selects it and shows a detail panel with Personal Tasks, Group Tasks, and Project Deadlines groups for that day
- FR-CAL-5: Sidebar shows an Upcoming Deadlines panel grouped by date (Today, Tomorrow, then by date) for all items from today onwards
- FR-CAL-6: Filters (All / Personal / Group / Critical) apply to both the calendar grid and the upcoming deadlines panel
- FR-CAL-7: Previous/Next month navigation and a "Today" shortcut button
- FR-CAL-8: Clicking a task item opens the Task Detail drawer; clicking a project deadline navigates to the Project Detail page

### Settings
- FR-SET-1: User can update profile (name, avatar)
- FR-SET-2: User can toggle light/dark theme
- FR-SET-3: User can log out

---

## Non-Functional Requirements

- NFR-1: App should load initial page in under 3 seconds on standard connection
- NFR-2: UI must work on desktop (1280px+); mobile is stretch goal
- NFR-3: All data queries must be scoped to the authenticated user
- NFR-4: No user can view or modify another user's personal tasks
- NFR-5: Project members can only see and act within projects they belong to

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
