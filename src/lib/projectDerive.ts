/**
 * Pure helpers that turn Supabase ProjectWithRelations[] into the view shapes
 * the UI components expect (ProjectCardData, TaskCardData, project detail).
 * Mirrors the mock store's derive functions but works on Supabase data and
 * uses the real auth user id.
 */

import type { ProjectWithRelations, ProjectMemberWithProfile } from '@/lib/api/projects'
import type { Project, ProjectCardData, TaskCardData, ProjectRole, ProjectLink } from '@/types'
import { calculateRisk, calculateProjectRisk } from '@/lib/risk'

/** Percentage of tasks that are done, rounded to the nearest integer. */
function calcProjectProgress(tasks: { status: string }[]): number {
  if (tasks.length === 0) return 0
  const completed = tasks.filter((t) => t.status === 'done').length
  return Math.round((completed / tasks.length) * 100)
}

export function toProjectCards(
  data: ProjectWithRelations[],
  userId: string
): ProjectCardData[] {
  return data.map(({ project, course, members, tasks }) => {
    const userMember = members.find((m) => m.user_id === userId)
    const progress = calcProjectProgress(tasks)
    return {
      id: project.id,
      name: project.name,
      course_code: course?.code ?? '',
      course_name: course?.name ?? '',
      deadline: project.deadline,
      member_count: members.length,
      user_role: (userMember?.role ?? 'member') as ProjectRole,
      progress,
      risk: calculateProjectRisk(tasks),
      status: project.status,
      completed_at: project.completed_at,
    }
  })
}

export interface ProjectDetailView {
  project: Project
  course?: { code: string; name: string }
  members: ProjectMemberWithProfile[]
  tasks: TaskCardData[]
  links: ProjectLink[]
  userRole: ProjectRole
  progress: number
  risk: ReturnType<typeof calculateProjectRisk>
}

export function toProjectDetail(
  data: ProjectWithRelations[],
  projectId: string,
  userId: string
): ProjectDetailView | null {
  const pd = data.find((d) => d.project.id === projectId)
  if (!pd) return null

  const { project, course, members, tasks, links } = pd
  const userMember = members.find((m) => m.user_id === userId)
  const progress = calcProjectProgress(tasks)

  const taskCards: TaskCardData[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    type: 'group',
    status: t.status,
    risk: calculateRisk({
      status: t.status,
      due_date: t.due_date,
      progress: t.progress,
      difficulty: t.difficulty,
    }),
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
    course: course ? { code: course.code, name: course.name } : undefined,
    members,
    tasks: taskCards,
    links,
    userRole: (userMember?.role ?? 'member') as ProjectRole,
    progress,
    risk: calculateProjectRisk(tasks),
  }
}

/** Project tasks assigned to the given user, as TaskCardData (for My Tasks). */
export function toAssignedTaskCards(
  data: ProjectWithRelations[],
  userId: string
): TaskCardData[] {
  const cards: TaskCardData[] = []
  for (const { project, tasks } of data) {
    for (const t of tasks) {
      if (t.assigned_to !== userId) continue
      cards.push({
        id: t.id,
        title: t.title,
        type: 'group',
        status: t.status,
        risk: calculateRisk({
          status: t.status,
          due_date: t.due_date,
          progress: t.progress,
          difficulty: t.difficulty,
        }),
        difficulty: t.difficulty,
        progress: t.progress,
        due_date: t.due_date,
        source_label: project.name,
        project_id: project.id,
        notes: t.notes,
        links: t.links,
        checklist: t.checklist,
        assigned_to: t.assigned_to,
      })
    }
  }
  return cards
}
