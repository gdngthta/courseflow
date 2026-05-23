# CourseFlow

**CourseFlow** is a student productivity web app that combines personal coursework task management and shared group project task management into one dashboard.

> One-week MVP — built with Next.js 16, TypeScript, Tailwind CSS v4, and Supabase.

---

## The Problem

Students manage personal assignments and group project responsibilities in separate tools. This causes missed deadlines, unclear accountability, and poor visibility of project progress.

## The Solution

CourseFlow combines both into one place. When a group project task is assigned to a student, it automatically appears in that student's **My Tasks** page — without duplicating data.

---

## Features

| Feature | Status |
|---|---|
| App shell (sidebar + topbar) | ✅ Phase 0 |
| Mock data + risk algorithm | ✅ Phase 0 |
| UI components + owl mascot | ✅ Phase 0 |
| Dashboard — priority, risk, deadlines, course overview | ✅ Phase 1 |
| My Tasks — tabs, filters, create/edit/delete, task detail | ✅ Phase 1 |
| Projects list + Create Project modal | ✅ Phase 1 |
| Project Detail — tasks, members, links, progress | ✅ Phase 1 |
| Courses management — add/edit/archive | ✅ Phase 1 |
| Settings — profile, preferences, account | ✅ Phase 1 |
| Calendar — monthly view, task/deadline plotting, filters | ✅ Phase 1 |
| Supabase DB schema + RLS | 🔜 Phase 2 |
| Auth (login, signup, session, middleware) | 🔜 Phase 3 |
| Connect real data (replace mock) | 🔜 Phase 4 |

> **Phase 1:** All screens use mock data. No Supabase, no auth, no database connected yet.
> Create/edit/delete update local React state only — changes reset on page refresh.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Backend/Auth/DB**: Supabase (PostgreSQL + Auth)
- **Icons**: lucide-react

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd courseflow
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your Supabase project URL and anon key from [supabase.com](https://supabase.com).

### 3. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
  app/
    (auth)/login/         Auth pages
    (app)/                App shell (sidebar + topbar)
      dashboard/
      tasks/
      projects/[id]/
      courses/
      calendar/
      settings/
  components/
    layout/               Sidebar, Topbar
    ui/                   Badge, Button, ProgressBar, Modal, EmptyState
    tasks/                Task-specific components
    projects/             Project-specific components
    courses/              Course-specific components
  lib/
    supabase.ts           Supabase client
    risk.ts               Risk status calculation
  types/index.ts          Shared TypeScript types
  data/mock.ts            Mock data (used until Supabase is connected)
docs/                     Project documentation
screenshots/              App screenshots
```

---

## Documentation

- [Project Overview](docs/PROJECT_OVERVIEW.md)
- [Requirements](docs/REQUIREMENTS.md)
- [System Design](docs/SYSTEM_DESIGN.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [Risk Algorithm](docs/RISK_ALGORITHM.md)
- [Test Plan](docs/TEST_PLAN.md)
- [Future Improvements](docs/FUTURE_IMPROVEMENTS.md)

---

## Current Phase: Phase 1 Complete — Next: Phase 2 Supabase Schema

Phase 1 delivered every screen as a fully working static UI with mock data, including the full Calendar page with monthly view, task/deadline plotting, filters, selected-date detail panel, and upcoming deadlines sidebar.

**Phase 2** will set up the Supabase project: create all tables (profiles, courses, personal_tasks, projects, project_members, project_tasks, project_links), write Row Level Security policies, and prepare SQL migration scripts.

Auth and real data connections are planned for Phase 3–4.
