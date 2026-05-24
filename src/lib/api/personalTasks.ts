import { createClient } from '@/lib/supabase'
import type { PersonalTask, TaskStatus, Difficulty, TaskLink, TaskChecklistItem } from '@/types'

interface PersonalTaskRow {
  id: string
  user_id: string
  course_id: string | null
  title: string
  notes: string | null
  due_date: string
  status: TaskStatus
  progress: number
  difficulty: number
  checklist: TaskChecklistItem[] | null
  links: TaskLink[] | null
  created_at: string
}

function rowToPersonalTask(row: PersonalTaskRow): PersonalTask {
  return {
    id: row.id,
    user_id: row.user_id,
    course_id: row.course_id ?? undefined,
    title: row.title,
    type: 'personal',
    status: row.status,
    difficulty: (row.difficulty as Difficulty) ?? 3,
    progress: row.progress,
    due_date: row.due_date,
    notes: row.notes ?? undefined,
    links: row.links && row.links.length > 0 ? row.links : undefined,
    checklist: row.checklist && row.checklist.length > 0 ? row.checklist : undefined,
    created_at: row.created_at,
  }
}

export interface PersonalTaskInput {
  title: string
  course_id?: string
  due_date: string
  status: TaskStatus
  progress: number
  difficulty: Difficulty
  notes?: string
  links: TaskLink[]
  checklist: TaskChecklistItem[]
}

/** All personal tasks for the signed-in user (RLS scopes to own rows). */
export async function getPersonalTasks(): Promise<PersonalTask[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('personal_tasks')
    .select('*')
    .order('due_date', { ascending: true })

  if (error) throw new Error(`Failed to load tasks: ${error.message}`)
  return (data ?? []).map((r) => rowToPersonalTask(r as PersonalTaskRow))
}

export async function createPersonalTask(input: PersonalTaskInput): Promise<PersonalTask> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('personal_tasks')
    .insert({
      user_id: user.id,
      course_id: input.course_id || null,
      title: input.title,
      notes: input.notes || null,
      due_date: input.due_date,
      status: input.status,
      progress: input.progress,
      difficulty: input.difficulty,
      links: input.links,
      checklist: input.checklist,
    })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to create task: ${error.message}`)
  return rowToPersonalTask(data as PersonalTaskRow)
}

export async function updatePersonalTask(
  id: string,
  input: Partial<PersonalTaskInput>
): Promise<PersonalTask> {
  const supabase = createClient()

  // Build a partial update payload, mapping app fields → DB columns
  const payload: Record<string, unknown> = {}
  if (input.title !== undefined) payload.title = input.title
  if (input.course_id !== undefined) payload.course_id = input.course_id || null
  if (input.notes !== undefined) payload.notes = input.notes || null
  if (input.due_date !== undefined) payload.due_date = input.due_date
  if (input.status !== undefined) payload.status = input.status
  if (input.progress !== undefined) payload.progress = input.progress
  if (input.difficulty !== undefined) payload.difficulty = input.difficulty
  if (input.links !== undefined) payload.links = input.links
  if (input.checklist !== undefined) payload.checklist = input.checklist

  const { data, error } = await supabase
    .from('personal_tasks')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(`Failed to update task: ${error.message}`)
  return rowToPersonalTask(data as PersonalTaskRow)
}

export async function deletePersonalTask(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('personal_tasks').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete task: ${error.message}`)
}

export async function updatePersonalTaskChecklist(
  id: string,
  checklist: TaskChecklistItem[]
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('personal_tasks')
    .update({ checklist })
    .eq('id', id)
  if (error) throw new Error(`Failed to update checklist: ${error.message}`)
}
