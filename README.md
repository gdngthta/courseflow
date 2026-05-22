# CourseFlow

**CourseFlow** is a student productivity web app that combines personal coursework task management and shared group project task management into one dashboard.

> One-week MVP — built with Next.js 16, TypeScript, Tailwind CSS v4, and Supabase.

---

## The Problem

Students manage personal assignments and group project responsibilities in separate tools. This causes missed deadlines, unclear accountability, and poor visibility of project progress.

## The Solution

CourseFlow combines both into one place. When a group project task is assigned to a student, it automatically appears in that student's **My Tasks** page — without duplicating data.

---

## Features (planned)

| Feature | Status |
|---|---|
| App shell (sidebar + topbar) | ✅ Phase 0 |
| Mock data + risk algorithm | ✅ Phase 0 |
| UI components + owl mascot | ✅ Phase 0 |
| Dashboard UI (mock data) | 🔜 Phase 1 |
| My Tasks UI (mock data) | 🔜 Phase 1 |
| Projects + Project Detail UI (mock data) | 🔜 Phase 1 |
| Task Detail + Create/Edit forms (mock data) | 🔜 Phase 1 |
| Courses + Settings UI (mock data) | 🔜 Phase 1 |
| Supabase DB schema + RLS | 🔜 Phase 2 |
| Auth (login, signup, session, middleware) | 🔜 Phase 3 |
| Connect real data (replace mock) | 🔜 Phase 4 |
| Calendar view + final polish | 🔜 Phase 5 |

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

## Current Phase: Phase 0 Complete — Next: Phase 1 Figma UI

Phase 0 established the project scaffold. All pages are currently placeholders.

**Phase 1** will convert every Figma screen into a real working UI using the existing mock data — Dashboard, My Tasks, Projects, Project Detail, Task Detail, Create/Edit forms, Courses, and Settings. No Supabase or auth yet.

Supabase and Auth are planned for Phase 2–3 after all UI screens are complete.
