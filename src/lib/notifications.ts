import { calculateRisk } from '@/lib/risk'
import { toAllTaskCards } from '@/lib/taskDerive'
import type { Course, PersonalTask, TaskCardData } from '@/types'
import type { ProjectWithRelations } from '@/lib/api/projects'

export type NotificationType =
  | 'overdue'
  | 'critical'
  | 'due_today'
  | 'due_tomorrow'
  | 'project_deadline'
  | 'member_added'

export type NotificationEntity = 'personal_task' | 'project_task' | 'project'

export interface AppNotification {
  /** Stable id: `[type]-[entity]-[entityId]-[dueDate]`. Used for dismiss state. */
  id: string
  type: NotificationType
  /** Discriminator so the click handler knows where to look up the entity. */
  entity: NotificationEntity
  entityId: string
  title: string
  subtitle: string
  /** ISO date — used for sorting + cleanup of old dismissed entries. */
  due_date: string
  /** Where to navigate when clicked (used for project-deadline notifications). */
  href: string
  /** Lower = more urgent. Used for sort + per-task collapse. */
  priority: number
}

const PRIORITY: Record<NotificationType, number> = {
  overdue: 0,
  critical: 1,
  due_today: 2,
  due_tomorrow: 3,
  project_deadline: 4,
  member_added: 5,
}

const ROLE_LABEL: Record<string, string> = {
  leader: 'Leader',
  admin: 'Editor',
  member: 'Viewer',
}

function todayISO(today: Date = new Date()): string {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate())
    .toISOString()
    .split('T')[0]
}

function daysUntil(due_date: string, today: Date = new Date()): number {
  const due = new Date(due_date + 'T00:00:00')
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Derive in-app notifications from current Supabase data.
 *
 * Rules:
 *  - Personal + assigned-project tasks (NOT duplicated).
 *  - Per task, emit at most ONE notification — the highest-priority
 *    type that applies (overdue > critical > due_today > due_tomorrow).
 *    Otherwise a critical-and-due-today task would generate 2 rows.
 *  - Project deadlines (active projects, within 7 days) get their own
 *    notification independent of any task notifications.
 *  - Returns sorted by priority then by due_date ascending.
 */
export function deriveNotifications(
  data: {
    userId: string
    courses: Course[]
    personalTasks: PersonalTask[]
    projects: ProjectWithRelations[]
  },
  today: Date = new Date()
): AppNotification[] {
  const tasks = toAllTaskCards(data.personalTasks, data.courses, data.projects, data.userId)

  const out: AppNotification[] = []

  // ── Task notifications ──
  for (const t of tasks) {
    if (t.status === 'done') continue
    const days = daysUntil(t.due_date, today)
    const risk = calculateRisk({
      status: t.status,
      due_date: t.due_date,
      progress: t.progress,
      difficulty: t.difficulty,
    })

    // Pick the most urgent applicable type.
    let type: NotificationType | null = null
    if (days < 0) type = 'overdue'
    else if (risk === 'critical') type = 'critical'
    else if (days === 0) type = 'due_today'
    else if (days === 1) type = 'due_tomorrow'

    if (!type) continue

    const entity: NotificationEntity = t.type === 'personal' ? 'personal_task' : 'project_task'
    out.push({
      id: `${type}-${entity}-${t.id}-${t.due_date}`,
      type,
      entity,
      entityId: t.id,
      title: t.title,
      subtitle: t.source_label,
      due_date: t.due_date,
      // href only used as a fallback navigation target; the click handler
      // re-looks up the task fresh from current data and opens the drawer.
      href: t.type === 'group' && t.project_id ? `/projects/${t.project_id}` : '/tasks',
      priority: PRIORITY[type],
    })
  }

  // ── Project deadline notifications ──
  // Phase 6A #10: window is 3 days, not 7 — only the very-soon project
  // deadlines belong in the notifications panel. Anything further out
  // is visible in Calendar / Projects already.
  for (const p of data.projects) {
    const proj = p.project
    if (proj.status !== 'active') continue
    const days = daysUntil(proj.deadline, today)
    if (days < 0 || days > 3) continue

    // If all tasks done (progress 100%), skip — same logic as the bot.
    const taskCount = p.tasks.length
    const doneCount = p.tasks.filter((t) => t.status === 'done').length
    if (taskCount > 0 && doneCount === taskCount) continue

    out.push({
      id: `project_deadline-project-${proj.id}-${proj.deadline}`,
      type: 'project_deadline',
      entity: 'project',
      entityId: proj.id,
      title: proj.name,
      subtitle: `Project deadline · ${days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `in ${days} days`}`,
      due_date: proj.deadline,
      href: `/projects/${proj.id}`,
      priority: PRIORITY.project_deadline,
    })
  }

  // ── Project membership notifications (recently added) ──
  // Show a one-time informational notification when the current user
  // was added to a project within the last 7 days (and didn't create it).
  for (const p of data.projects) {
    const proj = p.project
    // Skip if user created this project (they're the original leader)
    if (proj.created_by === data.userId) continue
    const myMembership = p.members.find((m) => m.user_id === data.userId)
    if (!myMembership) continue
    const joinedDateISO = myMembership.joined_at.split('T')[0]
    // daysUntil returns negative for past dates; -7..0 means "within last 7 days"
    const daysSinceJoined = daysUntil(joinedDateISO, today)
    if (daysSinceJoined < -7 || daysSinceJoined > 0) continue
    const roleLabel = ROLE_LABEL[myMembership.role] ?? 'member'
    out.push({
      id: `member_added-project-${proj.id}-${joinedDateISO}`,
      type: 'member_added',
      entity: 'project',
      entityId: proj.id,
      title: `Added to "${proj.name}"`,
      subtitle: `You joined as ${roleLabel}`,
      due_date: joinedDateISO,
      href: `/projects/${proj.id}`,
      priority: PRIORITY.member_added,
    })
  }

  out.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    return a.due_date.localeCompare(b.due_date)
  })

  return out
}

// ── localStorage dismiss state ───────────────────────────────

const STORAGE_KEY = 'courseflow:dismissed-notifications'

interface DismissedEntry {
  id: string
  /** ISO date in the id — used to prune old entries so localStorage doesn't grow forever. */
  due_date: string
}

export function loadDismissed(): DismissedEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as DismissedEntry[]
    if (!Array.isArray(parsed)) return []
    // Prune entries whose due_date is more than 30 days ago.
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const cutoffISO = cutoff.toISOString().split('T')[0]
    return parsed.filter((e) => e?.id && e?.due_date && e.due_date >= cutoffISO)
  } catch {
    return []
  }
}

export function saveDismissed(entries: DismissedEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    /* quota or private-mode — silently fail; user just sees them again */
  }
}

export function addDismissed(notification: AppNotification): void {
  const current = loadDismissed()
  if (current.some((e) => e.id === notification.id)) return
  current.push({ id: notification.id, due_date: notification.due_date })
  saveDismissed(current)
}

export function dismissAll(notifications: AppNotification[]): void {
  const current = loadDismissed()
  const byId = new Set(current.map((e) => e.id))
  for (const n of notifications) {
    if (!byId.has(n.id)) {
      current.push({ id: n.id, due_date: n.due_date })
      byId.add(n.id)
    }
  }
  saveDismissed(current)
}
