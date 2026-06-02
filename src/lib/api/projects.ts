import { createClient } from '@/lib/supabase'
import type {
  Project, ProjectMember, ProjectTask, ProjectLink, ProjectRole,
  TaskStatus, Difficulty, TaskLink, TaskChecklistItem,
} from '@/types'

// ── Public shapes ──

export interface ProjectMemberWithProfile extends ProjectMember {
  name: string
  email: string
}

export interface ProjectWithRelations {
  project: Project
  course?: { id: string; code: string; name: string }
  members: ProjectMemberWithProfile[]
  tasks: ProjectTask[]
  links: ProjectLink[]
}

// ── Raw row shapes returned by the nested select ──

interface RawCourse { id: string; code: string; name: string }
interface RawProfile { full_name: string | null; email: string | null }
interface RawMember {
  id: string; project_id: string; user_id: string
  role: ProjectRole; joined_at: string; profiles: RawProfile | null
}
interface RawTask {
  id: string; project_id: string; assigned_to: string | null
  title: string; notes: string | null; due_date: string
  status: TaskStatus; progress: number; difficulty: number
  checklist: TaskChecklistItem[] | null; links: TaskLink[] | null
  created_at: string
}
interface RawLink { id: string; project_id: string; label: string; url: string }
interface RawProjectRow {
  id: string; course_id: string | null; name: string; description: string | null
  deadline: string; status: 'active' | 'completed'; completed_at: string | null
  created_by: string | null; created_at: string
  courses: RawCourse | null
  project_members: RawMember[]
  project_tasks: RawTask[]
  project_links: RawLink[]
}

const SELECT = `
  id, course_id, name, description, deadline, status, completed_at, created_by, created_at,
  courses ( id, code, name ),
  project_members ( id, project_id, user_id, role, joined_at, profiles ( full_name, email ) ),
  project_tasks ( id, project_id, assigned_to, title, notes, due_date, status, progress, difficulty, checklist, links, created_at ),
  project_links ( id, project_id, label, url )
`

function mapRow(row: RawProjectRow): ProjectWithRelations {
  const project: Project = {
    id: row.id,
    name: row.name,
    course_id: row.course_id ?? '',
    description: row.description ?? undefined,
    deadline: row.deadline,
    status: row.status,
    completed_at: row.completed_at ?? undefined,
    created_by: row.created_by ?? '',
    created_at: row.created_at,
  }

  const course = row.courses
    ? { id: row.courses.id, code: row.courses.code, name: row.courses.name }
    : undefined

  const members: ProjectMemberWithProfile[] = (row.project_members ?? []).map((m) => ({
    id: m.id,
    project_id: m.project_id,
    user_id: m.user_id,
    role: m.role,
    joined_at: m.joined_at,
    name: m.profiles?.full_name || 'Unknown member',
    email: m.profiles?.email || '',
  }))

  const tasks: ProjectTask[] = (row.project_tasks ?? []).map((t) => ({
    id: t.id,
    project_id: t.project_id,
    title: t.title,
    type: 'group',
    status: t.status,
    difficulty: (t.difficulty as Difficulty) ?? 3,
    progress: t.progress,
    due_date: t.due_date,
    assigned_to: t.assigned_to ?? undefined,
    notes: t.notes ?? undefined,
    links: t.links && t.links.length > 0 ? t.links : undefined,
    checklist: t.checklist && t.checklist.length > 0 ? t.checklist : undefined,
    created_at: t.created_at,
  }))

  const links: ProjectLink[] = (row.project_links ?? []).map((l) => ({
    id: l.id,
    project_id: l.project_id,
    label: l.label,
    url: l.url,
  }))

  return { project, course, members, tasks, links }
}

/** All projects the signed-in user belongs to, with members/tasks/links. */
export async function getProjectsWithRelations(): Promise<ProjectWithRelations[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select(SELECT)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to load projects: ${error.message}`)
  return ((data ?? []) as unknown as RawProjectRow[]).map(mapRow)
}

export interface CreateProjectInput {
  name: string
  /** Optional. Empty string and missing are both normalised to null before insert. */
  course_id?: string
  deadline: string
  description?: string
}

/** Atomically create a project and add the creator as leader (via RPC). */
export async function createProject(input: CreateProjectInput): Promise<string> {
  const supabase = createClient()
  // Critical: never send '' to a uuid column. The course_id column is
  // nullable in the schema (`uuid references courses(id) on delete set null`),
  // but Postgres rejects '' before the nullability check even runs.
  const courseId = input.course_id && input.course_id.trim() ? input.course_id : null

  const { data, error } = await supabase.rpc('create_project', {
    p_name: input.name,
    p_course_id: courseId,
    p_deadline: input.deadline,
    p_description: input.description ?? null,
  })
  if (error) throw new Error(`Failed to create project: ${error.message}`)
  // RPC returns the new projects row
  return (data as { id: string }).id
}

export async function completeProject(id: string, completedAt: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('projects')
    .update({ status: 'completed', completed_at: completedAt })
    .eq('id', id)
  if (error) throw new Error(`Failed to complete project: ${error.message}`)
}

/**
 * Re-open a previously completed project. RLS only allows the
 * project leader to update the row (see projects_update policy
 * in phase3c.sql backed by is_project_leader). completed_at is
 * cleared so the History UI no longer shows it as completed.
 */
export async function reopenProject(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('projects')
    .update({ status: 'active', completed_at: null })
    .eq('id', id)
  if (error) throw new Error(`Failed to reopen project: ${error.message}`)
}
