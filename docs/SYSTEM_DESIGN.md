# CourseFlow — System Design

## Architecture Overview

CourseFlow is a full-stack web application using:
- **Next.js 16** (App Router) for the frontend and API routes
- **Supabase** for authentication, database (PostgreSQL), and row-level security
- **Tailwind CSS v4** for styling

```
Browser
  └─ Next.js App (React, App Router)
       ├─ Client Components (interactive UI)
       ├─ Server Components (data fetching)
       └─ Supabase Client (auth + DB queries)
            └─ Supabase (PostgreSQL + Auth + RLS)
```

## Route Structure

```
/                          → redirect to /dashboard
/(auth)/login              → login page
/(app)/dashboard           → dashboard (app shell)
/(app)/tasks               → my tasks
/(app)/projects            → projects list
/(app)/projects/[id]       → project detail
/(app)/courses             → course management
/(app)/calendar            → calendar view
/(app)/settings            → settings
```

## Component Structure

```
components/
  layout/
    Sidebar.tsx            Fixed left nav (240px)
    Topbar.tsx             Fixed top bar with search
  ui/
    Badge.tsx              RiskBadge, StatusBadge, TypeBadge, RoleBadge
    Button.tsx             Primary, Secondary, Destructive, Ghost
    ProgressBar.tsx        Visual progress indicator
    Modal.tsx              Reusable modal wrapper
    EmptyState.tsx         Empty state placeholder
  tasks/
    TaskCard.tsx           Task card (used on Dashboard + My Tasks)
    TaskDetail.tsx         Task detail modal
    CreateTaskModal.tsx    Create/edit personal task
  projects/
    ProjectCard.tsx        Project card (used on Projects list)
    ProjectDetail.tsx      Full project workspace
    AddTaskModal.tsx       Add project task modal
    InviteMemberModal.tsx  Invite member modal
  courses/
    CourseCard.tsx         Course card
    AddCourseModal.tsx     Add/edit course modal
```

## Data Flow — My Tasks (Core Feature)

```
My Tasks page
  ├─ Query: personal_tasks WHERE user_id = current_user
  └─ Query: project_tasks WHERE assigned_to = current_user
       └─ JOIN projects, courses for source_label

Both result sets are normalised into TaskCardData[] and rendered
by the same TaskCard component.

NO data is copied between tables.
```

## Data Flow — Calendar

```
Calendar page
  ├─ getMockTaskCards()     → all TaskCardData[] (personal + assigned group tasks)
  │    └─ filter: status !== 'done'  → activeTasks
  └─ getMockProjectCards()  → all ProjectCardData[]
       └─ filter: status === 'active' → activeProjects

Filter applied (All / Personal / Group / Critical) → filteredTasks

itemsByDate: Record<YYYY-MM-DD, CalendarItem[]>
  ├─ filteredTasks grouped by due_date
  └─ activeProjects grouped by deadline (All filter only)

CalendarItem union type:
  | { kind: 'task';    data: TaskCardData }
  | { kind: 'project'; id, name, courseCode, deadline }

getCalendarDays(year, month) → 42 Date cells (6 rows × 7 cols, starting Sunday)
toDateKey(date) → YYYY-MM-DD string (local time, avoids UTC offset issues)
```

## Data Flow — Risk Calculation

Risk is calculated entirely on the client side using `src/lib/risk.ts`.

Input: `{ status, due_date, progress, difficulty }`
Output: `'safe' | 'warning' | 'critical' | 'completed'`

The same function is used everywhere: Dashboard, My Tasks, Project Detail.

## Authentication Flow (Phase 3+)

```
User visits /dashboard
  └─ Middleware checks Supabase session
       ├─ No session → redirect to /login
       └─ Session valid → render app
```

## State Management

### Phase 1 — Shared Mock State (`src/store/mockStore.tsx`)

All entity state lives in a single React Context + useReducer store that is mounted at the `(app)` layout level.

```
MockStoreProvider  (app)/layout.tsx
  └─ MockState
       ├─ currentUser
       ├─ courses
       ├─ personalTasks  (links & checklist inlined)
       ├─ projects
       ├─ projectMembers
       ├─ projectTasks   (links & checklist inlined)
       └─ projectLinks
```

Every page calls `useMockStore()` to get `{ state, dispatch }`. Derived views (TaskCardData[], ProjectCardData[], project detail) are produced by pure helper functions (`deriveTaskCards`, `deriveProjectCards`, `deriveProjectDetail`) called inside `useMemo()`.

**MockAction union (all supported mutations):**
- Course: ADD_COURSE, UPDATE_COURSE, SET_COURSE_ARCHIVED
- Personal tasks: ADD_PERSONAL_TASK, UPDATE_PERSONAL_TASK, DELETE_PERSONAL_TASK, UPDATE_PERSONAL_TASK_CHECKLIST
- Project tasks: ADD_PROJECT_TASK, UPDATE_PROJECT_TASK, DELETE_PROJECT_TASK, UPDATE_PROJECT_TASK_NOTES, UPDATE_PROJECT_TASK_CHECKLIST
- Projects: ADD_PROJECT (+ auto userMember), COMPLETE_PROJECT

This ensures:
- Mutations on any page are immediately visible on every other page.
- Newly assigned project tasks appear in My Tasks without page reload.
- Calendar reflects newly created tasks and projects.
- Checklist toggles in the Task Detail drawer persist back to the store.
- Archived courses are excluded from task/project course dropdowns.

State resets on hard-refresh. Full server-side persistence is planned for Phase 2 (Supabase).

### Phase 2+ — Supabase

State management will be replaced with direct Supabase queries (server components + client mutations). The shared mock store will be removed.

## Security

- Supabase Row Level Security (RLS) enforces data ownership at the database level
- Users can only read/write rows they own or belong to
- Project role checks are enforced in both RLS policies and UI
