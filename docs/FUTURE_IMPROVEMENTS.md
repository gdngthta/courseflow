# CourseFlow — Future Improvements

> Features and improvements beyond the current MVP scope.

---

## Short-Term (Post-MVP, 1–2 weeks)

### Project Links CRUD
- The `project_links` table exists in Supabase and links are fetched in `ProjectWithRelations`
- The Project Detail page renders links but the "Add Link" button was deferred
- Implement: add/delete project links from the Project Detail workspace

### Profile Avatar Upload
- Settings avatar camera button is currently disabled
- Implement: upload avatar to Supabase Storage, save URL to `profiles.avatar_url`
- Show avatar in Sidebar and Settings instead of initials

### Real-Time Collaboration
- Live updates when a project member updates a task
- Supabase Realtime subscriptions for `project_tasks` and `project_members`
- No polling required — push updates to all open clients

### Notifications & Reminders
- In-app notification bell for: task assigned, deadline approaching, task updated
- Email reminders for critical tasks and upcoming deadlines
- Smart deadline reminders based on task difficulty and days remaining

#### Multi-Channel Automation (n8n)
The cleanest path for adding reminders without coupling the Next.js app to messaging SDKs is an **n8n** self-hosted workflow engine:

- n8n polls or receives a webhook from Supabase (via pg_cron or Edge Functions) when a task is approaching its deadline or is marked critical
- A single n8n workflow fans out to whichever channels the user has enabled:
  - **Telegram bot** — sends deadline alerts and task assignment notifications via Bot API
  - **WhatsApp** — sends reminders via the WhatsApp Cloud API (Meta) or Twilio for WhatsApp; no user app install required beyond number registration
  - **Email** — sends summary digests via SMTP or SendGrid
- n8n's visual workflow editor makes it easy to add new channels without changing application code
- User channel preferences (Telegram chat ID, WhatsApp number, email) would be stored in the `profiles` table and toggled from Settings

This keeps the Next.js app channel-agnostic: it writes events to Supabase, and n8n handles delivery. Adding a new channel (e.g., Discord, Slack) requires only a new n8n node — zero app-code changes.

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
