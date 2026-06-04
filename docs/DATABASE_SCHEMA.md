# CourseFlow — Database Schema

> All tables use Supabase (PostgreSQL). Row Level Security (RLS) is enabled on all tables.
> Non-recursive RLS is enforced via `SECURITY DEFINER` helper functions (see `supabase/phase3c.sql`).
> Telegram reminder tables are added in `supabase/phase4.sql`.

---

## Tables

### `profiles`
Automatically created on signup via `handle_new_user` trigger on `auth.users`.

| Column | Type | Notes |
|---|---|---|
| id | uuid | FK → auth.users.id (PK) |
| email | text | Copied from auth.users.email |
| full_name | text | nullable — set from signup metadata |
| avatar_url | text | nullable |
| telegram_chat_id | text | nullable — set from Settings → Reminders. Also the authorization key for the Telegram bot webhook. |
| telegram_enabled | boolean | default false — master switch for Telegram delivery AND for the command bot. |
| created_at | timestamptz | default now() |

RLS:
- Users can read/update their own profile row
- Project co-members can read each other's profiles (via `shares_project_with` helper)

---

### `courses`

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → profiles.id |
| code | text | e.g. "CS101" |
| name | text | e.g. "Introduction to Algorithms" |
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
| status | text | 'not_started' \| 'in_progress' \| 'review' \| 'done' |
| difficulty | int2 | 1–5 |
| progress | int2 | 0–100 |
| due_date | date | stored as YYYY-MM-DD |
| notes | text | nullable |
| links | jsonb | nullable — `[{ label, url }]` |
| checklist | jsonb | nullable — `[{ text, done }]` |
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
| deadline | date | stored as YYYY-MM-DD |
| status | text | 'active' \| 'completed', default 'active' |
| completed_at | date | nullable, set when status → completed |
| created_by | uuid | FK → profiles.id |
| created_at | timestamptz | default now() |

RLS:
- SELECT: project members, OR `created_by = auth.uid()` (allows creator to see immediately after `create_project` RPC)
- UPDATE: leader only
- DELETE: leader only
- INSERT: via `create_project` RPC only (SECURITY DEFINER)

---

### `project_members`

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | FK → projects.id |
| user_id | uuid | FK → profiles.id |
| role | text | 'leader' \| 'admin' \| 'member' |
| joined_at | timestamptz | default now() |

RLS:
- SELECT: project members (via `is_project_member` helper)
- INSERT: leader only (or via `invite_member` RPC)
- DELETE: leader only

UNIQUE: (project_id, user_id)

---

### `project_tasks`

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | FK → projects.id |
| title | text | |
| status | text | 'not_started' \| 'in_progress' \| 'review' \| 'done' |
| difficulty | int2 | 1–5 |
| progress | int2 | 0–100 |
| due_date | date | stored as YYYY-MM-DD |
| assigned_to | uuid | FK → profiles.id, nullable |
| notes | text | nullable |
| links | jsonb | nullable — `[{ label, url }]` |
| checklist | jsonb | nullable — `[{ text, done }]` |
| created_at | timestamptz | default now() |

RLS:
- SELECT: all project members
- INSERT/UPDATE/DELETE: leader or admin (via `is_project_manager` helper)
- UPDATE own task (progress/status): assigned member

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

## Key Design Decision: No Task Duplication

`project_tasks` stores group tasks. They are **never copied** into `personal_tasks`.

The My Tasks page combines personal + assigned project tasks purely client-side:

```ts
// src/lib/taskDerive.ts
toAllTaskCards(personalTasks, courses, projects, userId)
  // personal tasks fetched directly
  // project tasks filtered from ProjectWithRelations[] where assigned_to === userId
  // → TaskCardData[] rendered by a single TaskCard component
```

---

## Key Design Decision: links & checklist as JSONB

Rather than separate `task_links` and `task_checklist_items` tables (which would require per-task sub-queries), links and checklist items are stored as JSONB arrays directly on `personal_tasks` and `project_tasks`.

Tradeoff: simpler queries, less normalization. Acceptable for MVP — a single task rarely has more than 10 links or 20 checklist items.

---

### `reminder_preferences`
One row per user, holds toggles and timing for Telegram reminders.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → profiles.id, UNIQUE |
| enabled | boolean | default true — master toggle for the scheduled job |
| around_deadline_enabled | boolean | default true |
| high_risk_enabled | boolean | default true |
| days_before | integer | default 1, check in (0, 1, 3, 7) |
| send_time | text | default '06:00' — reminder time is fixed at 6:00 AM local; not user-configurable |
| timezone | text | default 'Asia/Kuala_Lumpur' — IANA timezone name; user selects in Settings |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() — auto-stamped via trigger |

RLS:
- Users can read/insert/update their own preferences row
- No delete policy — rows cascade with the profile

---

### `reminder_logs`
Audit trail of every Telegram reminder attempted. The composite unique
constraint is the duplicate-prevention mechanism — the cron job inserts
before sending, and a unique-violation means "already sent today, skip."

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → profiles.id |
| task_type | text | check in ('personal', 'project') |
| task_id | uuid | id of the underlying personal_task or project_task |
| reminder_type | text | check in ('around_deadline', 'high_risk') |
| sent_to | text | snapshot of the chat ID used (audit) |
| sent_date | date | default current_date |
| sent_at | timestamptz | default now() |
| status | text | check in ('sent', 'failed') |
| error_message | text | nullable — populated when status='failed' |

Unique constraint: `(user_id, task_type, task_id, reminder_type, sent_date)`

RLS:
- Users can read their own logs only
- No insert/update/delete policies — the cron job writes via the service role key (bypasses RLS)

---

---

### `project_invitations` (Phase 6C)
Pending invitations to join a project. Membership is only created after acceptance.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | FK → projects.id ON DELETE CASCADE |
| inviter_id | uuid | FK → profiles.id |
| invitee_user_id | uuid | FK → profiles.id |
| invitee_email | text | snapshot of email at time of invite |
| role | text | check in ('admin', 'member') — 'admin' = Editor, 'member' = Viewer |
| status | text | check in ('pending', 'accepted', 'declined', 'cancelled', 'expired') default 'pending' |
| created_at | timestamptz | default now() |
| expires_at | timestamptz | nullable — not currently set but reserved |
| responded_at | timestamptz | nullable — stamped on accept/decline |

Unique partial index: `(project_id, invitee_user_id) WHERE status = 'pending'` — prevents duplicate pending invitations.

RLS:
- Invitee can see their own invitations
- Project leader/editor can see all invitations for their projects

---

### `project_member_preferences` (Phase 6C)
Per-member personalization for a shared project (display name override, personal course mapping).

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | FK → projects.id ON DELETE CASCADE |
| user_id | uuid | FK → profiles.id |
| display_name | text | nullable — overrides project name in this user's view |
| personal_course_id | uuid | FK → courses.id ON DELETE SET NULL — shows project under this user's own course |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

Unique: `(project_id, user_id)`

RLS: Users can read/write only their own preferences.

---

### `notifications` (Phase 6C)
Persistent event notifications (invitations, role changes, task assignments).

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → profiles.id |
| type | text | e.g. `project_invitation_received`, `project_task_assigned`, `project_role_changed` |
| title | text | short notification title |
| message | text | full notification message |
| entity_type | text | nullable — e.g. `project`, `project_task`, `project_invitation` |
| entity_id | uuid | nullable — ID of the related entity |
| read_at | timestamptz | nullable — null = unread |
| created_at | timestamptz | default now() |

Index on `(user_id, created_at DESC) WHERE read_at IS NULL` for fast unread count.

RLS:
- Users can read their own notifications
- Users can update (mark as read) their own notifications
- SECURITY DEFINER RPCs insert notifications on behalf of other users

---

## Migrations

Run in this order:

| File | Description |
|---|---|
| `supabase/schema.sql` | Full initial schema — tables, triggers, indexes |
| `supabase/phase3c.sql` | RLS fix: SECURITY DEFINER helpers, recreated policies, `create_project` + `invite_member` RPCs |
| `supabase/phase4.sql` | Telegram reminders: profile columns, `reminder_preferences`, `reminder_logs` |
| `supabase/phase5.sql` | Profile consistency: `profiles_insert` RLS policy + backfill of orphan auth users |
| `supabase/phase5c.sql` | Adds `'review'` to the status check constraints on `personal_tasks` and `project_tasks` |
| `supabase/phase6c1.sql` | Collaboration system: `project_invitations`, `project_member_preferences`, `notifications`; all invitation/member-management RPCs; task-assignment trigger |
| `supabase/phase6g.sql` | Adds `timezone` column to `reminder_preferences` |
| `supabase/phase6_cleanup.sql` | Drops old `invite_member` RPC; normalizes `send_time = '06:00'`; fixes email case-sensitivity; fixes cancel-invitation notification cleanup |
