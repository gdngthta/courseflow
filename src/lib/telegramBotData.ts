import 'server-only'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { calculateRisk } from '@/lib/risk'
import type { Difficulty, RiskStatus, TaskStatus, ProjectRole } from '@/types'

/**
 * Server-side data layer for the Telegram bot.
 *
 * Every function takes an explicit `userId` (the matched CourseFlow
 * profile id) and is scoped to that user's data. Uses the service
 * role key so RLS is bypassed at the DB level — the userId scoping
 * IS our authorization boundary, and the only entry point is the
 * webhook handler that derives userId from the Telegram chat_id.
 */

// ── Shared output shape ──────────────────────────────────────

export interface BotTaskItem {
  task_id: string
  task_type: 'personal' | 'project'
  title: string
  status: TaskStatus
  progress: number
  difficulty: Difficulty
  due_date: string
  risk: RiskStatus
  course_label?: string  // for personal tasks
  project_name?: string  // for project tasks
}

export interface BotProjectItem {
  id: string
  name: string
  deadline: string
  role: ProjectRole
  progress: number
  status: 'active' | 'completed'
}

// ── Row shapes (Supabase joins) ──────────────────────────────

interface PersonalTaskRow {
  id: string
  title: string
  status: TaskStatus
  progress: number
  difficulty: Difficulty
  due_date: string
  course: { code: string; name: string } | { code: string; name: string }[] | null
}

interface ProjectTaskRow {
  id: string
  title: string
  status: TaskStatus
  progress: number
  difficulty: Difficulty
  due_date: string
  project: { id: string; name: string; status: string } | { id: string; name: string; status: string }[] | null
}

interface MembershipRow {
  role: ProjectRole
  project: {
    id: string
    name: string
    deadline: string
    status: 'active' | 'completed'
  } | {
    id: string
    name: string
    deadline: string
    status: 'active' | 'completed'
  }[] | null
}

// ── Helpers ─────────────────────────────────────────────────

function unwrapOne<T>(rel: T | T[] | null): T | null {
  if (rel === null) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

function riskOf(t: { status: TaskStatus; due_date: string; progress: number; difficulty: number }): RiskStatus {
  return calculateRisk({
    status: t.status,
    due_date: t.due_date,
    progress: t.progress,
    difficulty: t.difficulty,
  })
}

// ── Fetchers ────────────────────────────────────────────────

/**
 * Returns all incomplete personal tasks owned by the user, joined
 * with their course (code + name). Used by /critical, /today,
 * /upcoming, /closest.
 */
export async function fetchIncompletePersonalTasks(userId: string): Promise<BotTaskItem[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('personal_tasks')
    .select(`
      id, title, status, progress, difficulty, due_date,
      course:courses ( code, name )
    `)
    .eq('user_id', userId)
    .neq('status', 'done')

  if (error) throw new Error(`Failed to load personal tasks: ${error.message}`)

  const rows = (data ?? []) as unknown as PersonalTaskRow[]
  return rows.map((r) => {
    const course = unwrapOne(r.course)
    return {
      task_id: r.id,
      task_type: 'personal' as const,
      title: r.title,
      status: r.status,
      progress: r.progress,
      difficulty: r.difficulty,
      due_date: r.due_date,
      risk: riskOf(r),
      course_label: course ? `${course.code} — ${course.name}` : undefined,
    }
  })
}

/**
 * Returns incomplete project tasks assigned to the user. Filters out
 * tasks whose parent project is completed (My Tasks rule). Joined
 * with project name.
 */
export async function fetchIncompleteAssignedProjectTasks(userId: string): Promise<BotTaskItem[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('project_tasks')
    .select(`
      id, title, status, progress, difficulty, due_date,
      project:projects ( id, name, status )
    `)
    .eq('assigned_to', userId)
    .neq('status', 'done')

  if (error) throw new Error(`Failed to load project tasks: ${error.message}`)

  const rows = (data ?? []) as unknown as ProjectTaskRow[]
  const out: BotTaskItem[] = []
  for (const r of rows) {
    const project = unwrapOne(r.project)
    // Skip tasks under completed projects — they're history, not actionable.
    if (project?.status === 'completed') continue
    out.push({
      task_id: r.id,
      task_type: 'project',
      title: r.title,
      status: r.status,
      progress: r.progress,
      difficulty: r.difficulty,
      due_date: r.due_date,
      risk: riskOf(r),
      project_name: project?.name,
    })
  }
  return out
}

/**
 * Returns the user's combined incomplete task list — personal +
 * assigned project tasks, with NO duplication. This is the bot
 * equivalent of the My Tasks combine rule.
 */
export async function fetchCombinedIncompleteTasks(userId: string): Promise<BotTaskItem[]> {
  const [personal, projectTasks] = await Promise.all([
    fetchIncompletePersonalTasks(userId),
    fetchIncompleteAssignedProjectTasks(userId),
  ])
  return [...personal, ...projectTasks]
}

/**
 * Returns active projects where the user is a member, with the
 * user's role and a progress percentage derived from project_tasks.
 */
export async function fetchActiveProjects(userId: string): Promise<BotProjectItem[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('project_members')
    .select(`
      role,
      project:projects ( id, name, deadline, status )
    `)
    .eq('user_id', userId)

  if (error) throw new Error(`Failed to load projects: ${error.message}`)

  const memberships = (data ?? []) as unknown as MembershipRow[]
  const activeProjects = memberships
    .map((m) => ({ role: m.role, project: unwrapOne(m.project) }))
    .filter((m): m is { role: ProjectRole; project: { id: string; name: string; deadline: string; status: 'active' | 'completed' } } =>
      m.project !== null && m.project.status === 'active'
    )

  if (activeProjects.length === 0) return []

  // Fetch task counts for these projects to derive progress.
  const projectIds = activeProjects.map((p) => p.project.id)
  const { data: tasksData, error: tasksErr } = await supabase
    .from('project_tasks')
    .select('project_id, status')
    .in('project_id', projectIds)

  if (tasksErr) throw new Error(`Failed to load project tasks for progress: ${tasksErr.message}`)

  const progressByProject = new Map<string, number>()
  const tasks = (tasksData ?? []) as Array<{ project_id: string; status: TaskStatus }>
  for (const pid of projectIds) {
    const t = tasks.filter((x) => x.project_id === pid)
    if (t.length === 0) {
      progressByProject.set(pid, 0)
      continue
    }
    const done = t.filter((x) => x.status === 'done').length
    progressByProject.set(pid, Math.round((done / t.length) * 100))
  }

  return activeProjects.map((m) => ({
    id: m.project.id,
    name: m.project.name,
    deadline: m.project.deadline,
    role: m.role,
    progress: progressByProject.get(m.project.id) ?? 0,
    status: m.project.status,
  }))
}

/**
 * Find the profile linked to a given Telegram chat ID. Returns null
 * if no match OR if telegram_enabled is false. This is the bot's
 * sole authorization mechanism.
 */
export interface BotProfile {
  id: string
  full_name: string
}

export async function findProfileByChatId(chatId: string): Promise<BotProfile | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, telegram_enabled')
    .eq('telegram_chat_id', chatId)
    .maybeSingle()

  if (error) throw new Error(`Profile lookup failed: ${error.message}`)
  if (!data) return null
  if (!data.telegram_enabled) return null

  return { id: data.id, full_name: data.full_name ?? '' }
}
