'use client'

/**
 * Phase 1 — Shared Mock State
 *
 * A single React Context + useReducer store that holds all entity state for the
 * Phase 1 demo.  Every page reads from (and writes to) this store so that
 * mutations made on one page are immediately visible on every other page.
 *
 * This is intentionally a simple local-state solution.
 * No Supabase, no persistence across hard-reloads, no auth.
 * Phase 2 will replace this with real Supabase queries.
 */

import React, { createContext, useContext, useReducer } from 'react'
import type {
  User, Course, PersonalTask, Project, ProjectMember,
  ProjectTask, ProjectLink, TaskCardData, ProjectCardData,
  ProjectRole, TaskChecklistItem, TaskLink,
} from '@/types'
import {
  MOCK_USER, MOCK_COURSES, MOCK_PERSONAL_TASKS, MOCK_PROJECTS,
  MOCK_PROJECT_MEMBERS, MOCK_PROJECT_TASKS, MOCK_PROJECT_LINKS,
  MOCK_TASK_LINKS, MOCK_TASK_CHECKLISTS, MOCK_MEMBERS,
} from '@/data/mock'
import { calculateRisk, calculateProjectRisk } from '@/lib/risk'

// ─────────────────────────────────────────────
// State shape
// ─────────────────────────────────────────────

export interface MockState {
  currentUser: User
  courses: Course[]
  personalTasks: PersonalTask[]  // links & checklist are inlined
  projects: Project[]
  projectMembers: ProjectMember[]
  projectTasks: ProjectTask[]    // links & checklist are inlined
  projectLinks: ProjectLink[]
}

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────

export type MockAction =
  // Courses
  | { type: 'ADD_COURSE'; course: Course }
  | { type: 'UPDATE_COURSE'; course: Course }
  | { type: 'SET_COURSE_ARCHIVED'; id: string; archived: boolean }
  // Personal tasks
  | { type: 'ADD_PERSONAL_TASK'; task: PersonalTask }
  | { type: 'UPDATE_PERSONAL_TASK'; task: PersonalTask }
  | { type: 'DELETE_PERSONAL_TASK'; id: string }
  | { type: 'UPDATE_PERSONAL_TASK_CHECKLIST'; id: string; checklist: TaskChecklistItem[] }
  // Project tasks
  | { type: 'ADD_PROJECT_TASK'; task: ProjectTask }
  | { type: 'UPDATE_PROJECT_TASK'; task: ProjectTask }
  | { type: 'DELETE_PROJECT_TASK'; id: string }
  | { type: 'UPDATE_PROJECT_TASK_NOTES'; id: string; notes: string }
  | { type: 'UPDATE_PROJECT_TASK_CHECKLIST'; id: string; checklist: TaskChecklistItem[] }
  // Projects
  | { type: 'ADD_PROJECT'; project: Project; userMember: ProjectMember }
  | { type: 'COMPLETE_PROJECT'; id: string; completedAt: string }

// ─────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────

function mockReducer(state: MockState, action: MockAction): MockState {
  switch (action.type) {
    // ── Courses ──
    case 'ADD_COURSE':
      return { ...state, courses: [...state.courses, action.course] }
    case 'UPDATE_COURSE':
      return { ...state, courses: state.courses.map((c) => c.id === action.course.id ? action.course : c) }
    case 'SET_COURSE_ARCHIVED':
      return { ...state, courses: state.courses.map((c) => c.id === action.id ? { ...c, is_archived: action.archived } : c) }

    // ── Personal tasks ──
    case 'ADD_PERSONAL_TASK':
      return { ...state, personalTasks: [...state.personalTasks, action.task] }
    case 'UPDATE_PERSONAL_TASK':
      return { ...state, personalTasks: state.personalTasks.map((t) => t.id === action.task.id ? action.task : t) }
    case 'DELETE_PERSONAL_TASK':
      return { ...state, personalTasks: state.personalTasks.filter((t) => t.id !== action.id) }
    case 'UPDATE_PERSONAL_TASK_CHECKLIST':
      return { ...state, personalTasks: state.personalTasks.map((t) => t.id === action.id ? { ...t, checklist: action.checklist } : t) }

    // ── Project tasks ──
    case 'ADD_PROJECT_TASK':
      return { ...state, projectTasks: [...state.projectTasks, action.task] }
    case 'UPDATE_PROJECT_TASK':
      return { ...state, projectTasks: state.projectTasks.map((t) => t.id === action.task.id ? action.task : t) }
    case 'DELETE_PROJECT_TASK':
      return { ...state, projectTasks: state.projectTasks.filter((t) => t.id !== action.id) }
    case 'UPDATE_PROJECT_TASK_NOTES':
      return { ...state, projectTasks: state.projectTasks.map((t) => t.id === action.id ? { ...t, notes: action.notes } : t) }
    case 'UPDATE_PROJECT_TASK_CHECKLIST':
      return { ...state, projectTasks: state.projectTasks.map((t) => t.id === action.id ? { ...t, checklist: action.checklist } : t) }

    // ── Projects ──
    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [action.project, ...state.projects],
        projectMembers: [...state.projectMembers, action.userMember],
      }
    case 'COMPLETE_PROJECT':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.id ? { ...p, status: 'completed', completed_at: action.completedAt } : p
        ),
      }

    default:
      return state
  }
}

// ─────────────────────────────────────────────
// Initial state — merges MOCK_TASK_LINKS and MOCK_TASK_CHECKLISTS inline
// ─────────────────────────────────────────────

const initialState: MockState = {
  currentUser: MOCK_USER,
  courses: MOCK_COURSES,
  personalTasks: MOCK_PERSONAL_TASKS.map((t) => ({
    ...t,
    links: MOCK_TASK_LINKS[t.id],
    checklist: MOCK_TASK_CHECKLISTS[t.id],
  })),
  projects: MOCK_PROJECTS,
  projectMembers: MOCK_PROJECT_MEMBERS,
  projectTasks: MOCK_PROJECT_TASKS.map((t) => ({
    ...t,
    links: MOCK_TASK_LINKS[t.id],
    checklist: MOCK_TASK_CHECKLISTS[t.id],
  })),
  projectLinks: MOCK_PROJECT_LINKS,
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

interface MockStoreContextValue {
  state: MockState
  dispatch: React.Dispatch<MockAction>
}

const MockStoreContext = createContext<MockStoreContextValue | null>(null)

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export function MockStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(mockReducer, initialState)
  return (
    <MockStoreContext.Provider value={{ state, dispatch }}>
      {children}
    </MockStoreContext.Provider>
  )
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useMockStore(): MockStoreContextValue {
  const ctx = useContext(MockStoreContext)
  if (!ctx) throw new Error('useMockStore must be used inside <MockStoreProvider>')
  return ctx
}

// ─────────────────────────────────────────────
// Derived helpers — call these inside useMemo() in each page
// ─────────────────────────────────────────────

/** All personal tasks + assigned group tasks → TaskCardData[], ready for TaskCard */
export function deriveTaskCards(state: MockState): TaskCardData[] {
  const courseMap = Object.fromEntries(state.courses.map((c) => [c.id, c]))
  const projectMap = Object.fromEntries(state.projects.map((p) => [p.id, p]))

  const personal: TaskCardData[] = state.personalTasks.map((t) => {
    const course = t.course_id ? courseMap[t.course_id] : undefined
    return {
      id: t.id,
      title: t.title,
      type: 'personal' as const,
      status: t.status,
      risk: calculateRisk({ status: t.status, due_date: t.due_date, progress: t.progress, difficulty: t.difficulty }),
      difficulty: t.difficulty,
      progress: t.progress,
      due_date: t.due_date,
      source_label: course ? `${course.code} — ${course.name}` : 'No course',
      course_id: t.course_id,
      notes: t.notes,
      links: t.links,
      checklist: t.checklist,
    }
  })

  const assigned: TaskCardData[] = state.projectTasks
    .filter((t) => t.assigned_to === state.currentUser.id)
    .map((t) => {
      const project = projectMap[t.project_id]
      const course = project ? courseMap[project.course_id] : undefined
      return {
        id: t.id,
        title: t.title,
        type: 'group' as const,
        status: t.status,
        risk: calculateRisk({ status: t.status, due_date: t.due_date, progress: t.progress, difficulty: t.difficulty }),
        difficulty: t.difficulty,
        progress: t.progress,
        due_date: t.due_date,
        source_label: project ? project.name : 'Unknown project',
        project_id: t.project_id,
        course_id: course?.id,
        notes: t.notes,
        links: t.links,
        checklist: t.checklist,
        assigned_to: t.assigned_to,
      }
    })

  return [...personal, ...assigned]
}

/** All projects → ProjectCardData[], ready for ProjectCard */
export function deriveProjectCards(state: MockState): ProjectCardData[] {
  const courseMap = Object.fromEntries(state.courses.map((c) => [c.id, c]))

  return state.projects.map((p) => {
    const course = courseMap[p.course_id]
    const members = state.projectMembers.filter((m) => m.project_id === p.id)
    const tasks = state.projectTasks.filter((t) => t.project_id === p.id)
    const userMember = members.find((m) => m.user_id === state.currentUser.id)
    const completedCount = tasks.filter((t) => t.status === 'done').length
    const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

    return {
      id: p.id,
      name: p.name,
      course_code: course?.code ?? '',
      course_name: course?.name ?? '',
      deadline: p.deadline,
      member_count: members.length,
      user_role: (userMember?.role ?? 'member') as ProjectRole,
      progress,
      risk: calculateProjectRisk(tasks),
      status: p.status,
      completed_at: p.completed_at,
    }
  })
}

/** Full detail for a single project page */
export function deriveProjectDetail(state: MockState, projectId: string) {
  const project = state.projects.find((p) => p.id === projectId)
  if (!project) return null

  const course = state.courses.find((c) => c.id === project.course_id)
  const members = state.projectMembers.filter((m) => m.project_id === projectId)
  const tasks = state.projectTasks.filter((t) => t.project_id === projectId)
  const links = state.projectLinks.filter((l) => l.project_id === projectId)
  const userMember = members.find((m) => m.user_id === state.currentUser.id)
  const completedCount = tasks.filter((t) => t.status === 'done').length
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  const enrichedMembers = members.map((m) => ({
    ...m,
    name: MOCK_MEMBERS[m.user_id]?.name ?? m.user_id,
    email: MOCK_MEMBERS[m.user_id]?.email ?? '',
  }))

  const enrichedTasks: TaskCardData[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    type: 'group' as const,
    status: t.status,
    risk: calculateRisk({ status: t.status, due_date: t.due_date, progress: t.progress, difficulty: t.difficulty }),
    difficulty: t.difficulty,
    progress: t.progress,
    due_date: t.due_date,
    source_label: project.name,
    project_id: project.id,
    notes: t.notes,
    links: t.links,
    checklist: t.checklist,
    assigned_to: t.assigned_to,
  }))

  return {
    project,
    course,
    members: enrichedMembers,
    tasks: enrichedTasks,
    links,
    userRole: (userMember?.role ?? 'member') as ProjectRole,
    progress,
    risk: calculateProjectRisk(tasks),
  }
}

// Re-export for convenience (pages that need it for dispatch comparisons)
export type { TaskLink, TaskChecklistItem }
