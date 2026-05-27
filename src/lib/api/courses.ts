import { createClient } from '@/lib/supabase'
import type { Course } from '@/types'

interface CourseRow {
  id: string
  user_id: string
  code: string
  name: string
  lecturer: string | null
  semester: string | null
  color: string
  is_archived: boolean
  created_at: string
}

function rowToCourse(row: CourseRow): Course {
  return {
    id: row.id,
    user_id: row.user_id,
    code: row.code,
    name: row.name,
    lecturer: row.lecturer ?? undefined,
    semester: row.semester ?? undefined,
    color: row.color,
    is_archived: row.is_archived,
    created_at: row.created_at,
  }
}

export interface CourseInput {
  code: string
  name: string
  lecturer?: string
  semester?: string
  color: string
}

/** All courses for the signed-in user (RLS scopes to own rows). */
export async function getCourses(): Promise<Course[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Failed to load courses: ${error.message}`)
  return (data ?? []).map((r) => rowToCourse(r as CourseRow))
}

export async function createCourse(input: CourseInput): Promise<Course> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('courses')
    .insert({
      user_id: user.id,
      code: input.code,
      name: input.name,
      lecturer: input.lecturer ?? null,
      semester: input.semester ?? null,
      color: input.color,
    })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to create course: ${error.message}`)
  return rowToCourse(data as CourseRow)
}

export async function updateCourse(id: string, input: CourseInput): Promise<Course> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('courses')
    .update({
      code: input.code,
      name: input.name,
      lecturer: input.lecturer ?? null,
      semester: input.semester ?? null,
      color: input.color,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(`Failed to update course: ${error.message}`)
  return rowToCourse(data as CourseRow)
}

export async function setCourseArchived(id: string, archived: boolean): Promise<Course> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('courses')
    .update({ is_archived: archived })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(`Failed to ${archived ? 'archive' : 'unarchive'} course: ${error.message}`)
  return rowToCourse(data as CourseRow)
}
