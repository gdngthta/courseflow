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

## MVP Scope

This is a one-week MVP. The goal is a working, demonstrable product — not a full-featured Trello or Notion clone.

Out of scope for MVP:
- Real-time collaboration
- File attachments
- Email/push notifications
- Mobile native app
- Grade tracking
- Calendar integrations (Google Calendar, etc.)
