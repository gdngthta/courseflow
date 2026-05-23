# CourseFlow — Future Improvements

> Features and improvements beyond the one-week MVP scope.

---

## Short-Term (Post-MVP, 1–2 weeks)

### Real-Time Collaboration
- Live updates when a project member updates a task
- Supabase Realtime subscriptions for project_tasks and project_members

### Notifications
- In-app notification bell for: task assigned to you, deadline approaching, task updated
- Email reminders for critical tasks and upcoming deadlines

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
- View historical progress

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

- Add proper error boundaries and loading states
- Add unit tests for all UI components
- Migrate to server-side data fetching with React Server Components for better performance
- Add rate limiting and abuse prevention on API routes
- Add proper logging and error monitoring (Sentry)
