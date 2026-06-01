# CourseFlow — Project Overview

## What is CourseFlow?

CourseFlow is a student productivity web app for managing personal coursework tasks and shared group project tasks in one unified dashboard.

## The Core Problem

University students typically juggle:
- Personal coursework: readings, lab submissions, assignments, exam prep
- Group project responsibilities: tasks assigned by a project leader within a shared team

These are usually managed in separate apps (or not managed at all), leading to missed deadlines, unclear team accountability, and no visibility into overall workload risk.

## The Core Solution

CourseFlow solves this by:
1. Letting students manage personal tasks linked to their courses
2. Letting students create group project workspaces with role-based access
3. Automatically surfacing assigned group project tasks in the student's personal task view
4. Calculating a risk status for every task and project based on deadline proximity, progress, and difficulty

## Most Important Feature

When a project leader/admin assigns a group task to a member, that task appears in the assigned member's **My Tasks** page — under the project name — without creating a duplicate personal task record.

## Main Pages

| Page | Purpose |
|---|---|
| Dashboard | Overview of today's priority tasks, critical risks, upcoming deadlines, and course health |
| My Tasks | All tasks assigned to the user (personal + group) |
| Projects | List of all group project workspaces the user belongs to |
| Project Detail | Full workspace: tasks, members, progress, links |
| Courses | Manage enrolled courses used for filtering and context |
| Calendar | Monthly view with tasks plotted by due date |
| Settings | Profile, theme preference, account |

## Brand & Mascot

CourseFlow uses a **nerdy owl** as its mascot — a friendly, slightly academic character with round glasses that reinforces the student productivity theme.

The owl is used sparingly as a brand element, not a UI feature:
- Empty states (no tasks, no projects, no critical tasks, no courses)
- Dashboard assistant/tip card
- Welcome/onboarding moments

The owl is **not** used on task cards, project data tables, or anywhere that would reduce readability or feel childish.

The current owl is an SVG placeholder at `src/components/brand/OwlMascot.tsx`. It supports three variants: `default`, `reading` (holds a book), and `thinking` (thought dots). It is designed to be easy to replace with a custom illustration later.

---

## MVP Scope

This is a one-week MVP. The goal is a working, demonstrable product — not a full-featured Trello or Notion clone.

Out of scope for MVP:
- Real-time collaboration
- File attachments
- Email/push notifications
- Mobile native app
- Grade tracking
- Calendar integrations (Google Calendar, etc.)

---

## Current Limitations

Known limitations of the MVP that will be addressed post-launch:

| Area | Limitation |
|---|---|
| **Course visibility** | Courses are strictly user-scoped. Project co-members without the same course added will see blank course code/name on shared tasks. |
| **Real-time sync** | Data is fetched once on load. Changes made by another team member in a shared project are not reflected until the page is refreshed. |
| **Mobile layout** | The UI targets desktop (1280px+). On small screens the sidebar collapses but some table/grid layouts may overflow. |
| **Avatar upload** | Avatars are initials only. Supabase Storage integration is deferred. |
| **Project links** | The "Important Links" panel on Project Detail is read-only. Add/delete links UI is deferred. |
| **Email / push notifications** | No email or push delivery. Telegram reminders (Phase 4.5) and the in-app notifications panel (Phase 5A) are the only delivery channels. |
| **Notification dismiss state** | Stored per browser in `localStorage`. Dismissals do not carry across devices — a Supabase-backed dismissal table is future work. |
| **Theme persistence** | Persisted per browser in `localStorage`. Cross-device sync would require a `profiles.theme` column. |
