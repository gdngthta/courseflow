import type { Course, PersonalTask, TaskCardData } from '@/types'
import type { ProjectWithRelations } from '@/lib/api/projects'
import { toAssignedTaskCards } from '@/lib/projectDerive'

export type SearchResultKind = 'task' | 'project' | 'course'

export interface SearchResult {
  kind: SearchResultKind
  id: string
  title: string
  subtitle: string
  /** Where to navigate when clicked. */
  href: string
  /** Optional task object — passed back so callers can open the detail drawer instead of routing. */
  task?: TaskCardData
}

/**
 * Pure global search over the user's CourseFlow data.
 *
 * Match rule: case-insensitive substring on the visible-to-user
 * fields (title / code / name). No fuzzy / no Levenshtein — keep
 * it predictable so users understand why a result matched.
 *
 * Results are capped per-group so the dropdown stays bounded
 * even when a query like "a" matches everything.
 */
const PER_GROUP_LIMIT = 5

export function runGlobalSearch(
  query: string,
  data: {
    userId: string
    courses: Course[]
    personalTasks: PersonalTask[]
    projects: ProjectWithRelations[]
  }
): { tasks: SearchResult[]; projects: SearchResult[]; courses: SearchResult[] } {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return { tasks: [], projects: [], courses: [] }

  // ── Courses ──
  const courses: SearchResult[] = data.courses
    .filter((c) => {
      const hay = `${c.code} ${c.name} ${c.lecturer ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
    .slice(0, PER_GROUP_LIMIT)
    .map((c) => ({
      kind: 'course',
      id: c.id,
      title: c.code,
      subtitle: c.name + (c.is_archived ? ' · archived' : ''),
      href: `/courses`,
    }))

  // ── Projects (only ones the user is a member of) ──
  const projects: SearchResult[] = data.projects
    .map((p) => p.project)
    .filter((p) => p.name.toLowerCase().includes(q))
    .slice(0, PER_GROUP_LIMIT)
    .map((p) => ({
      kind: 'project',
      id: p.id,
      title: p.name,
      subtitle:
        data.courses.find((c) => c.id === p.course_id)?.code ??
        (p.status === 'completed' ? 'Completed project' : 'Project'),
      href: `/projects/${p.id}`,
    }))

  // ── Tasks (personal + assigned project) ──
  // Build TaskCardData for both source types so the dropdown can
  // open the existing Task Detail drawer with full context.

  const personalCards: TaskCardData[] = data.personalTasks.map((t) => {
    const course = data.courses.find((c) => c.id === t.course_id)
    return {
      id: t.id,
      title: t.title,
      type: 'personal',
      status: t.status,
      // Risk will be recalculated by the drawer if needed; placeholder here is fine
      risk: 'safe',
      difficulty: t.difficulty,
      progress: t.progress,
      due_date: t.due_date,
      source_label: course ? `${course.code} — ${course.name}` : 'Personal',
      course_id: t.course_id,
      notes: t.notes,
      links: t.links,
      checklist: t.checklist,
    }
  })

  const assignedCards = toAssignedTaskCards(data.projects, data.userId)

  const allTaskCards = [...personalCards, ...assignedCards]
  const tasks: SearchResult[] = allTaskCards
    .filter((t) => t.title.toLowerCase().includes(q) || t.source_label.toLowerCase().includes(q))
    .slice(0, PER_GROUP_LIMIT)
    .map((t) => ({
      kind: 'task',
      id: t.id,
      title: t.title,
      subtitle: t.source_label,
      // Tasks don't have a stable detail-page URL; clicking opens the drawer.
      href: t.type === 'group' && t.project_id ? `/projects/${t.project_id}` : '/tasks',
      task: t,
    }))

  return { tasks, projects, courses }
}
