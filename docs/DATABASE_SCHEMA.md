# CourseFlow — Database Schema

> All tables use Supabase (PostgreSQL). Row Level Security (RLS) is enabled on all tables.

---

## Tables

### `profiles`
Extends Supabase auth.users.

| Column | Type | Notes |
|---|---|---|
| id | uuid | FK → auth.users.id (PK) |
| first_name | text | |
| last_name | text | |
| avatar_url | text | nullable |
| created_at | timestamptz | default now() |

RLS: Users can only read/update their own profile.

---

### `courses`

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → profiles.id |
| code | text | e.g. "WIA2005" |
| name | text | e.g. "Algorithm Design" |
| lecturer | text | nullable |
| semester | text | nullable |
| color | text | hex color |
| is_archived | boolean | default false |
| created_at | timestamptz | default now() |

RLS: Users can only CRUD their own courses.

---

### `personal_tasks`

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → profiles.id |
| course_id | uuid | FK → courses.id, nullable |
| title | text | |
| status | text | 'not_started' \| 'in_progress' \| 'done' |
| difficulty | int2 | 1–5 |
| progress | int2 | 0–100 |
| due_date | date | |
| notes | text | nullable |
| created_at | timestamptz | default now() |

RLS: Users can only CRUD their own personal_tasks.

---

### `projects`

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | |
| course_id | uuid | FK → courses.id, nullable |
| description | text | nullable |
| deadline | date | |
| status | text | 'active' \| 'completed', default 'active' |
| completed_at | date | nullable, set when status → completed |
| created_by | uuid | FK → profiles.id |
| created_at | timestamptz | default now() |

RLS: Readable by project members. Only leader can update/delete.

---

### `project_members`

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | FK → projects.id |
| user_id | uuid | FK → profiles.id |
| role | text | 'leader' \| 'admin' \| 'member' |
| joined_at | timestamptz | default now() |

RLS: Readable by project members. Only leader can insert/delete.

UNIQUE: (project_id, user_id)

---

### `project_tasks`

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | FK → projects.id |
| title | text | |
| status | text | 'not_started' \| 'in_progress' \| 'done' |
| difficulty | int2 | 1–5 |
| progress | int2 | 0–100 |
| due_date | date | |
| assigned_to | uuid | FK → profiles.id, nullable |
| notes | text | nullable |
| created_at | timestamptz | default now() |

RLS:
- Readable by all project members
- INSERT/UPDATE/DELETE by leader or admin
- Assigned member can UPDATE their own task's progress/status only

---

### `project_links`

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | FK → projects.id |
| label | text | |
| url | text | |
| created_at | timestamptz | default now() |

RLS: Readable by project members. Leader/Admin can CRUD.

---

### `task_links` _(planned — Phase 4+)_

Resource links attached to individual personal or project tasks.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| task_type | text | 'personal' \| 'group' |
| task_id | uuid | FK → personal_tasks.id or project_tasks.id |
| label | text | Display label |
| url | text | URL |
| created_at | timestamptz | default now() |

RLS: Readable by task owner or project members. Writable by task creator or leader/admin.

> **Phase 1:** Mocked in-memory as `links?: TaskLink[]` on `TaskCardData`.

---

### `task_checklist_items` _(planned — Phase 4+)_

Sub-task checklist items for personal or project tasks.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| task_type | text | 'personal' \| 'group' |
| task_id | uuid | FK → personal_tasks.id or project_tasks.id |
| text | text | Checklist item label |
| done | boolean | default false |
| position | int2 | Display order |
| created_at | timestamptz | default now() |

RLS: Same as parent task.

> **Phase 1:** Mocked in-memory as `checklist?: TaskChecklistItem[]` on `TaskCardData`. Checkbox state is local to the modal session and resets on close.

---

## Key Design Decision: No Task Duplication

`project_tasks` stores group tasks. They are **never copied** into `personal_tasks`.

The My Tasks page combines:
```sql
SELECT * FROM personal_tasks WHERE user_id = $1
UNION ALL
SELECT pt.*, p.name as project_name FROM project_tasks pt
JOIN project_members pm ON pt.project_id = pm.project_id
WHERE pt.assigned_to = $1 AND pm.user_id = $1
```

This ensures a single source of truth per task.
