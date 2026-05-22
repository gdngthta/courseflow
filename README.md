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
| Auth (Supabase email/password) | 🔜 Phase 1 |
| Course management | 🔜 Phase 2 |
| Personal task CRUD | 🔜 Phase 2 |
| Projects + project tasks | 🔜 Phase 3 |
| Dashboard with risk overview | 🔜 Phase 4 |
| Calendar view | 🔜 Phase 5 |
| Settings + theme toggle | 🔜 Phase 5 |

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

## Current Phase: Phase 0 — Setup

Phase 0 establishes the project scaffold. No real data or auth yet. All pages show placeholder content. Mock data is available at `src/data/mock.ts`.
