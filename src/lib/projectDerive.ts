/**
 * Pure helpers that turn Supabase ProjectWithRelations[] into the view shapes
 * the UI components expect (ProjectCardData, TaskCardData, project detail).
 * Mirrors the mock store's derive functions but works on Supabase data and
 * uses the real auth user id.
 *
 * All three derive functions respect project_member_preferences:
 *   - display_name  → overrides the project name shown to this user
 *   - personal_course_id → overrides which course the project appears under
 */

import type { ProjectWithRelations, ProjectMemberWithProfile, ProjectInvitationForProject } from '@/lib/api/projects'
import type { Course, Project, ProjectCardData, TaskCardData, ProjectRole, ProjectLink } from '@/types'
import { calculateRisk, calculateProjectRisk } from '@/lib/risk'

/** Percentage of tasks that are done, rounded to the nearest integer. */
function calcProjectProgress(tasks: { status: string }[]): number {
  if (tasks.length === 0) return 0
  const completed = tasks.filter((t) => t.status === 'done').length
  return Math.round((completed / tasks.length) * 100)
}

/**
 * Resolve the effective course for a project, honouring personal_course_id
 * preferences. Falls back to the project's own course if no preference is set
 * or if the preferred course isn't found in the provided list.
 */
function resolveEffectiveCourse(
  projectCourse: { id: string; code: string; name: string } | undefined,
  personalCourseId: string | null | undefined,
  courses: Course[]
): { id: string; code: string; name: string } | undefined {
  if (personalCourseId) {
    const found = courses.find((c) => c.id === personalCourseId)
    if (found) return { id: found.id, code: found.code, name: found.name }
  }
  return projectCourse
}

export function toProjectCards(
  data: ProjectWithRelations[],
  userId: string,
  courses: Course[] = []
): ProjectCardData[] {
  return data.map(({ project, course, members, tasks, myPreferences }) => {
    const userMember = members.find((m) => m.user_id === userId)
    const progress = calcProjectProgress(tasks)
    const completed = tasks.filter((t) => t.status === 'done').length
    const assignedToMe = tasks.filter(
      (t) => t.assigned_to === userId && t.status !== 'done'
    ).length
    const incompleteTasks = tasks.filter((t) => t.status !== 'done')
    const nearestTaskDue = incompleteTasks.reduce<string | null>(
      (min, t) => (t.due_date && (!min || t.due_date < min) ? t.due_date : min),
      null
    )

    // Apply personal preferences
    const effectiveName   = myPreferences?.display_name   || project.name
    const effectiveCourse = resolveEffectiveCourse(course, myPreferences?.personal_course_id, courses)

    return {
      id: project.id,
      name: effectiveName,
      course_code: effectiveCourse?.code ?? '',
      course_name: effectiveCourse?.name ?? '',
      deadline: project.deadline,
      member_count: members.length,
      user_role: (userMember?.role ?? 'member') as ProjectRole,
      progress,
      risk: calculateProjectRisk(tasks),
      status: project.status,
      completed_at: project.completed_at,
      total_tasks: tasks.length,
      completed_tasks: completed,
      incomplete_tasks: tasks.length - completed,
      assigned_to_me: assignedToMe,
      nearest_task_due: nearestTaskDue,
    }
  })
}

export interface ProjectDetailView {
  project: Project
  course?: { id: string; code: string; name: string }
  members: ProjectMemberWithProfile[]
  tasks: TaskCardData[]
  links: ProjectLink[]
  invitations: ProjectInvitationForProject[]
  userRole: ProjectRole
  progress: number
  risk: ReturnType<typeof calculateProjectRisk>
  /** Effective display name for this user (preferences.display_name ?? project.name). */
  effectiveName: string
}

export function toProjectDetail(
  data: ProjectWithRelations[],
  projectId: string,
  userId: string,
  courses: Course[] = []
): ProjectDetailView | null {
  const pd = data.find((d) => d.project.id === projectId)
  if (!pd) return null

  const { project, course, members, tasks, links, invitations, myPreferences } = pd
  const userMember      = members.find((m) => m.user_id === userId)
  const progress        = calcProjectProgress(tasks)
  const effectiveName   = myPreferences?.display_name   || project.name
  const effectiveCourse = resolveEffectiveCourse(course, myPreferences?.personal_course_id, courses)
  // The course_id used for My Tasks filtering within this detail view
  const effectiveCourseId = effectiveCourse?.id || project.course_id || undefined

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
    source_label: effectiveName,
    project_id: project.id,
    // Use the effective (possibly personal) course so the My Tasks course
    // filter buckets these tasks under the user's preferred course.
    course_id: effectiveCourseId,
    notes: t.notes,
    links: t.links,
    checklist: t.checklist,
    assigned_to: t.assigned_to,
  }))

  return {
    project,
    course: effectiveCourse,
    members,
    tasks: taskCards,
    links,
    invitations: invitations ?? [],
    userRole: (userMember?.role ?? 'member') as ProjectRole,
    progress,
    risk: calculateProjectRisk(tasks),
    effectiveName,
  }
}

/** Project tasks assigned to the given user, as TaskCardData (for My Tasks / Calendar). */
export function toAssignedTaskCards(
  data: ProjectWithRelations[],
  userId: string,
  courses: Course[] = []
): TaskCardData[] {
  const cards: TaskCardData[] = []
  for (const { project, tasks, myPreferences } of data) {
    const effectiveName     = myPreferences?.display_name     || project.name
    const effectiveCourseId = myPreferences?.personal_course_id
      // Validate the preference references a course this user actually has
      ? (courses.find((c) => c.id === myPreferences.personal_course_id)?.id ?? project.course_id ?? undefined)
      : (project.course_id || undefined)

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
        source_label: effectiveName,
        project_id: project.id,
        course_id: effectiveCourseId,
        notes: t.notes,
        links: t.links,
        checklist: t.checklist,
        assigned_to: t.assigned_to,
      })
    }
  }
  return cards
}
