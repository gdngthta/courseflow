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

export interface AppNotification {
  /** Stable id: `[type]-[entityType]-[entityId]-[dueDate]`. Used for dismiss state. */
  id: string
  type: NotificationType
  title: string
  subtitle: string
  /** ISO date — used for sorting + cleanup of old dismissed entries. */
  due_date: string
  /** Where to navigate when clicked. */
  href: string
  /** Optional task object so the drawer can open instead of routing. */
  task?: TaskCardData
  /** Lower = more urgent. Used for sort + per-task collapse. */
  priority: number
}

const PRIORITY: Record<NotificationType, number> = {
  overdue: 0,
  critical: 1,
  due_today: 2,
  due_tomorrow: 3,
  project_deadline: 4,
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
  const today_ = todayISO(today)
  void today_

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

    const entityType = t.type === 'personal' ? 'personal' : 'project'
    out.push({
      id: `${type}-${entityType}-${t.id}-${t.due_date}`,
      type,
      title: t.title,
      subtitle: t.source_label,
      due_date: t.due_date,
      href: t.type === 'group' && t.project_id ? `/projects/${t.project_id}` : '/tasks',
      task: t,
      priority: PRIORITY[type],
    })
  }

  // ── Project deadline notifications ──
  for (const p of data.projects) {
    const proj = p.project
    if (proj.status !== 'active') continue
    const days = daysUntil(proj.deadline, today)
    if (days < 0 || days > 7) continue

    // If all tasks done (progress 100%), skip — same logic as the bot.
    const taskCount = p.tasks.length
    const doneCount = p.tasks.filter((t) => t.status === 'done').length
    if (taskCount > 0 && doneCount === taskCount) continue

    out.push({
      id: `project_deadline-project-${proj.id}-${proj.deadline}`,
      type: 'project_deadline',
      title: proj.name,
      subtitle: `Project deadline · ${days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `in ${days} days`}`,
      due_date: proj.deadline,
      href: `/projects/${proj.id}`,
      priority: PRIORITY.project_deadline,
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
