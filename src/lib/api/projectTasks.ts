import { createClient } from '@/lib/supabase'
import type { TaskStatus, Difficulty, TaskLink, TaskChecklistItem } from '@/types'

export interface ProjectTaskInput {
  project_id: string
  title: string
  assigned_to?: string
  due_date: string
  difficulty: Difficulty
  notes?: string
  links: TaskLink[]
  checklist: TaskChecklistItem[]
}

export interface ProjectTaskUpdate {
  title?: string
  assigned_to?: string | null
  due_date?: string
  status?: TaskStatus
  progress?: number
  difficulty?: Difficulty
  notes?: string | null
  links?: TaskLink[]
  checklist?: TaskChecklistItem[]
}

export async function createProjectTask(input: ProjectTaskInput): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('project_tasks').insert({
    project_id: input.project_id,
    assigned_to: input.assigned_to || null,
    created_by: user.id,
    title: input.title,
    notes: input.notes || null,
    due_date: input.due_date,
    status: 'not_started',
    progress: 0,
    difficulty: input.difficulty,
    links: input.links,
    checklist: input.checklist,
  })
  if (error) throw new Error(`Failed to create project task: ${error.message}`)
}

export async function updateProjectTask(id: string, update: ProjectTaskUpdate): Promise<void> {
  const supabase = createClient()
  const payload: Record<string, unknown> = {}
  if (update.title !== undefined) payload.title = update.title
  if (update.assigned_to !== undefined) payload.assigned_to = update.assigned_to || null
  if (update.due_date !== undefined) payload.due_date = update.due_date
  if (update.status !== undefined) payload.status = update.status
  if (update.progress !== undefined) payload.progress = update.progress
  if (update.difficulty !== undefined) payload.difficulty = update.difficulty
  if (update.notes !== undefined) payload.notes = update.notes || null
  if (update.links !== undefined) payload.links = update.links
  if (update.checklist !== undefined) payload.checklist = update.checklist

  const { error } = await supabase.from('project_tasks').update(payload).eq('id', id)
  if (error) throw new Error(`Failed to update project task: ${error.message}`)
}

export async function deleteProjectTask(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('project_tasks').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete project task: ${error.message}`)
}

export async function updateProjectTaskNotes(id: string, notes: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('project_tasks').update({ notes: notes || null }).eq('id', id)
  if (error) throw new Error(`Failed to update notes: ${error.message}`)
}

export async function updateProjectTaskChecklist(id: string, checklist: TaskChecklistItem[]): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('project_tasks').update({ checklist }).eq('id', id)
  if (error) throw new Error(`Failed to update checklist: ${error.message}`)
}
