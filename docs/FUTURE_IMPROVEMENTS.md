# CourseFlow — Future Improvements

> Features and improvements beyond the current MVP scope.

---

## Short-Term (Post-MVP, 1–2 weeks)

### Project Links CRUD
- The `project_links` table exists in Supabase and links are fetched in `ProjectWithRelations`
- The Project Detail page renders links but the "Add Link" button was deferred
- Implement: add/delete project links from the Project Detail workspace

### Profile Avatar Upload
- Settings → Profile currently shows initials only (the disabled camera button was removed in Phase 5A as part of the "no fake UI" pass)
- Implement: upload avatar to Supabase Storage, save URL to `profiles.avatar_url`
- Show avatar in Sidebar and Settings instead of initials
- Add back the camera-overlay button on the avatar circle once the storage path is wired

### Notifications — Cross-Device Persistence
- Notification dismiss state is currently stored in `localStorage` under `courseflow:dismissed-notifications`, so dismissals don't carry across browsers/devices
- Move dismiss state to a Supabase `notification_dismissals` table keyed by (user_id, notification_id, sent_date)
- Same RLS pattern as `reminder_logs`

### Real-Time Collaboration
- Live updates when a project member updates a task
- Supabase Realtime subscriptions for `project_tasks` and `project_members`
- No polling required — push updates to all open clients

### Notifications & Reminders

**Shipped in Phase 4.5 + Phase 6G:**
- Telegram scheduled reminders (around-deadline + high-risk), hourly Vercel Cron with timezone-aware send time
- Per-user preferences: send time, timezone (IANA), days-before window, test send, audit log, duplicate prevention
- Telegram command bot (`/start`, `/critical`, `/today`, `/upcoming`, `/closest`, `/projects`, `/help`) with plain-English aliases
- My Tasks tasks sorted: active/critical first, completed tasks pushed to bottom

### Per-Member Project Personalisation
The current model treats a project's `course_id` as the leader's
choice; co-members from a different course see the project under
"Project course from leader" naming. A future `project_member_preferences`
table (user_id, project_id, display_name, course_id) would let each
member map a shared project to one of their own courses or rename
the display label. RLS scoped to `user_id = auth.uid()`.

### Light Theme (deferred — currently dark-only)
Phase 5G removed light theme support after we couldn't reach an
acceptable contrast/polish bar across all pages. A future re-attempt
would need:
- A design pass on the indigo accent against white backgrounds
- A pass on every translucent overlay (calendar pills, badges, etc.)
- Auditing every `dark:` modifier for a matching light variant
- Re-introducing the ThemeContext toggle + Settings dropdown

### Kanban Board — Polish
Shipped in Phase 5C as a list/board toggle on My Tasks with HTML5 drag-drop + status-select fallback. Possible follow-ups:
- Library-backed DnD (`@dnd-kit/core` or `dnd-kit`) for touch / keyboard support and animated card placement
- Per-project Kanban view on the Project Detail page (currently only the My Tasks view has a board)
- Manual within-column ordering (an explicit `position` int column on tasks); today columns sort by due date
- Bulk multi-select drag (move several cards at once)

**Bot — explicitly out of scope (kept simple on purpose):**
- No LLM / no natural-language understanding — exact alias matching only
- Bot is read-only — no commands to create, edit, complete, or delete tasks from chat
- No multi-step conversations / no inline keyboards / no per-task drill-down

**Still to do:**
- In-app notification bell for: task assigned, deadline approaching, task updated
- Email reminders (SMTP or Resend) for critical tasks and upcoming deadlines
- Hourly cron (rather than daily) so the "Preferred send time" field becomes real
- Per-task custom send schedules
- Reminder *digests* (one Telegram message summarising the day's tasks instead of one-per-task)
- Failure retry policy beyond the current day-lock

#### WhatsApp Delivery (future)
The current `reminder_logs` schema already supports a third channel without changes — `sent_to` is just a string. To add WhatsApp:

- Add `whatsapp_number` + `whatsapp_enabled` to `profiles`
- Add a `sendWhatsAppMessage()` helper alongside `sendTelegramMessage()`, using the WhatsApp Cloud API (Meta) or Twilio for WhatsApp
- Extend the cron loop to fan out to enabled channels per user

Not shipped in MVP — Telegram covers the core demo and WhatsApp Cloud API requires business verification.

#### Multi-Channel Automation (n8n, future optional layer)
For deployments that want more than 2–3 channels, an **n8n** self-hosted workflow engine is the natural next step:

- The Next.js app stays focused on data + the daily cron *trigger*
- The cron fires a webhook into n8n with the candidate list
- n8n fans out to Telegram, WhatsApp, Discord, Slack, email, SMS — adding a new channel becomes a new n8n node with zero app-code changes
- User per-channel preferences stay in `profiles` / `reminder_preferences`

This is intentionally **not** part of the MVP: the current single-endpoint Vercel Cron is simpler and ships the same user-facing feature for the Telegram-only case.

### Mobile Responsive Layout
- The MVP targets desktop (1280px+)
- Responsive sidebar that collapses to a bottom nav on mobile

### Task Comments / Activity Log
- Per-task comment thread
- Activity log on Project Detail: "Sarah marked task as Done"

---

## Medium-Term (Month 2)

### Calendar Enhancements
- Sync due dates to Google Calendar or Apple Calendar (iCal export)
- Week view and agenda/list view in addition to monthly grid
- Drag-and-drop task rescheduling directly on the calendar
- Color-coded course overlay (show per-course color rather than task type)

### Checklist Enhancements
- Checklist items on project tasks assignable to specific sub-members
- Due dates per checklist item

### File Attachments
- Attach files to tasks or project notes via Supabase Storage

### Search
- Global search across tasks, projects, and courses
- Currently the topbar search is a UI placeholder

### Multiple Semesters
- Archive entire semester with all its courses and tasks
- View historical progress across semesters

### Multi-User Course Visibility
- Currently courses are strictly user-scoped; project co-members without the course added see blank course code/name
- Allow non-owner members to read course names they're associated with through a project

---

## Long-Term (Product Vision)

### Team Chat (per project)
- Basic messaging channel per project workspace

### Grade Tracking
- Attach grade/weight to personal tasks
- Track GPA contribution per course

### AI Study Planner
- Suggest daily study schedules based on deadlines, difficulty, and progress
- Auto-generate task breakdowns for large assignments

### Integrations
- Canvas / Blackboard LMS integration to pull assignment due dates
- Notion import for existing task lists

### Public Project Workspaces
- Share a project workspace publicly for portfolio purposes

---

## Technical Debt / Code Quality

- Add React error boundaries (component-level crash recovery)
- Add unit tests for all UI components (currently only risk algorithm is unit-tested)
- Migrate hot paths to React Server Components for better initial load performance
- Add rate limiting and abuse prevention
- Add proper error monitoring (Sentry or similar)
- Settings profile name save currently updates auth metadata client-side — could be moved to a server action for better consistency
