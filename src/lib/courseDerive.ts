/**
 * Pure helpers for deriving per-course task / project stats used by the
 * Course Selector strip in My Tasks (Phase 6B).
 */

import type { Course, TaskCardData } from '@/types'
import type { ProjectWithRelations } from '@/lib/api/projects'

export interface CourseStats {
  id: string
  code: string
  name: string
  color: string
  is_archived: boolean
  /** True when the course belongs to another user's project (no entry in user's own courses). */
  is_shared: boolean
  total_tasks: number
  completed_tasks: number
  incomplete_tasks: number
  active_projects: number
  /** ISO date string of the nearest upcoming incomplete task, or null. */
  nearest_due_date: string | null
}

/**
 * Build per-course statistics from the user's courses, all task cards, and
 * projects. Tasks that carry a `course_id` belonging to another user's project
 * (shared context) produce a synthetic CourseStats entry marked `is_shared`.
 */
export function toCourseStats(
  courses: Course[],
  allTasks: TaskCardData[],
  projects: ProjectWithRelations[]
): CourseStats[] {
  const statsMap = new Map<string, CourseStats>()

  // Seed from the user's own courses first (preserves color + archived flag).
  for (const c of courses) {
    statsMap.set(c.id, {
      id: c.id,
      code: c.code,
      name: c.name,
      color: c.color,
      is_archived: c.is_archived,
      is_shared: false,
      total_tasks: 0,
      completed_tasks: 0,
      incomplete_tasks: 0,
      active_projects: 0,
      nearest_due_date: null,
    })
  }

  // Add shared courses derived from projects the user is a member of but
  // whose course belongs to another user (not in the courses list above).
  for (const { project, course } of projects) {
    if (!course || !project.course_id) continue
    if (!statsMap.has(course.id)) {
      statsMap.set(course.id, {
        id: course.id,
        code: course.code,
        name: course.name,
        color: '#6366f1', // indigo fallback for shared courses
        is_archived: false,
        is_shared: true,
        total_tasks: 0,
        completed_tasks: 0,
        incomplete_tasks: 0,
        active_projects: 0,
        nearest_due_date: null,
      })
    }
  }

  // Accumulate task counts per course.
  for (const task of allTasks) {
    if (!task.course_id) continue
    const stats = statsMap.get(task.course_id)
    if (!stats) continue
    stats.total_tasks++
    if (task.status === 'done') {
      stats.completed_tasks++
    } else {
      stats.incomplete_tasks++
      // Track nearest upcoming due date among incomplete tasks.
      if (
        task.due_date &&
        (!stats.nearest_due_date || task.due_date < stats.nearest_due_date)
      ) {
        stats.nearest_due_date = task.due_date
      }
    }
  }

  // Accumulate active project counts per course.
  for (const { project } of projects) {
    if (!project.course_id || project.status !== 'active') continue
    const stats = statsMap.get(project.course_id)
    if (!stats) continue
    stats.active_projects++
  }

  return Array.from(statsMap.values())
}

// ── Deadline summary helpers ──

export interface DeadlineSummary {
  dueToday: number
  dueTomorrow: number
  dueThisWeek: number
  critical: number
}

/** Add `days` calendar days to an ISO date string and return the result. */
function shiftDate(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

/**
 * Compute deadline bucket counts for a set of tasks relative to today.
 * Only incomplete tasks (status !== 'done') are considered.
 */
export function getDeadlineSummary(tasks: TaskCardData[], todayISO: string): DeadlineSummary {
  const tomorrow = shiftDate(todayISO, 1)
  const endOfWeek = shiftDate(todayISO, 7)
  const incomplete = tasks.filter((t) => t.status !== 'done')
  return {
    dueToday: incomplete.filter((t) => t.due_date === todayISO).length,
    dueTomorrow: incomplete.filter((t) => t.due_date === tomorrow).length,
    dueThisWeek: incomplete.filter(
      (t) => t.due_date > todayISO && t.due_date <= endOfWeek
    ).length,
    critical: incomplete.filter((t) => t.risk === 'critical').length,
  }
}
