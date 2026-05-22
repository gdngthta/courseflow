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

For MVP scope, state is managed with React's built-in hooks (`useState`, `useEffect`). No global state library is needed at this scale.

## Security

- Supabase Row Level Security (RLS) enforces data ownership at the database level
- Users can only read/write rows they own or belong to
- Project role checks are enforced in both RLS policies and UI
