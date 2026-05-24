/**
 * Shared helpers for turning Supabase personal tasks + project tasks into the
 * combined TaskCardData[] that My Tasks, Dashboard, and Calendar all render.
 */

import type { Course, PersonalTask, TaskCardData } from '@/types'
import { calculateRisk } from '@/lib/risk'
import type { ProjectWithRelations } from '@/lib/api/projects'
import { toAssignedTaskCards } from '@/lib/projectDerive'

/** Map a Supabase personal task → TaskCardData for the shared TaskCard UI. */
export function personalTaskToCard(task: PersonalTask, courses: Course[]): TaskCardData {
  const course = task.course_id ? courses.find((c) => c.id === task.course_id) : undefined
  return {
    id: task.id,
    title: task.title,
    type: 'personal',
    status: task.status,
    risk: calculateRisk({
      status: task.status,
      due_date: task.due_date,
      progress: task.progress,
      difficulty: task.difficulty,
    }),
    difficulty: task.difficulty,
    progress: task.progress,
    due_date: task.due_date,
    source_label: course ? `${course.code} — ${course.name}` : 'No course',
    course_id: task.course_id,
    notes: task.notes,
    links: task.links,
    checklist: task.checklist,
  }
}

/**
 * Combined personal tasks + assigned group tasks.
 * Project tasks are NOT duplicated — they're derived from the projects the
 * user belongs to, filtered by assigned_to === userId.
 */
export function toAllTaskCards(
  personalTasks: PersonalTask[],
  courses: Course[],
  projects: ProjectWithRelations[],
  userId: string
): TaskCardData[] {
  const personal = personalTasks.map((t) => personalTaskToCard(t, courses))
  const assigned = toAssignedTaskCards(projects, userId)
  return [...personal, ...assigned]
}

/** Map of user_id → display name, gathered from all project memberships. */
export function buildMemberNameMap(projects: ProjectWithRelations[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const { members } of projects) {
    for (const m of members) map[m.user_id] = m.name
  }
  return map
}
