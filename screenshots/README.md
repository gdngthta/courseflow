# Screenshots

Screenshots of the CourseFlow app. To be captured from the running dev server
or the production Vercel deployment.

> **Safety:** when capturing the **Settings → Reminders** screen,
> redact the Telegram chat ID and any preview of `reminder_logs` rows
> that show real chat IDs. When capturing a Telegram conversation,
> make sure the chat title / user handle is acceptable to share, and
> never include the bot token or webhook secret.

## Checklist

- [ ] Landing page — full scroll capture (hero, features, personal-vs-shared, workflow, CTA, footer)
- [ ] Landing page — hero alone (showing floating cards + dashboard preview)
- [ ] Login page
- [ ] Signup page
- [ ] Dashboard — greeting, summary cards, Today's Priority, Critical Risk, Upcoming Deadlines, Course Overview
- [ ] My Tasks — **List view**, All tab with personal + group tasks
- [ ] My Tasks — **Board (Kanban) view** with all four columns populated
- [ ] My Tasks — task detail drawer (checklist, links, notes)
- [ ] Topbar — global search dropdown open with results across Tasks / Projects / Courses
- [ ] Topbar — notifications bell panel open
- [ ] Projects list — active projects with risk badges
- [ ] Project Detail — tasks grid, members panel, progress bar
- [ ] Project Detail — completed project (read-only banner)
- [ ] Courses — active courses with task/project counts
- [ ] Calendar — monthly grid with task pills and project deadline pills (LIGHT mode preferred for readability)
- [ ] Calendar — day detail panel (personal tasks, group tasks, project deadlines)
- [ ] Settings — profile section
- [ ] Settings — Reminders section showing Telegram connection + bot commands list
- [ ] Telegram conversation — bot reply to `/help`, `/critical`, or `/closest` (safe to share)

## Filenames suggestion

To make the README links predictable, save as:
`landing.png`, `dashboard.png`, `tasks-list.png`, `tasks-board.png`,
`task-drawer.png`, `topbar-search.png`, `topbar-notifications.png`,
`projects.png`, `project-detail.png`, `project-completed.png`,
`courses.png`, `calendar.png`, `calendar-day.png`,
`settings-profile.png`, `settings-reminders.png`,
`telegram-help.png`, `telegram-critical.png`.
