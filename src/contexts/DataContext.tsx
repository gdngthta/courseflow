'use client'

/**
 * Phase 3B — Supabase-backed data store for courses + personal tasks.
 *
 * This context progressively replaces the mock store for the entities that
 * have been migrated to Supabase. It loads the signed-in user's courses and
 * personal tasks, and exposes mutation helpers that write to Supabase and
 * keep local state in sync (optimistic where it matters for snappy UX).
 *
 * Projects / project members / project tasks still live in the mock store
 * until Phase 3C. Dashboard + Calendar are wired up in Phase 3D.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import type { Course, PersonalTask, TaskChecklistItem } from '@/types'
import { useAuthUser } from '@/contexts/AuthContext'
import * as coursesApi from '@/lib/api/courses'
import * as tasksApi from '@/lib/api/personalTasks'

interface DataContextValue {
  courses: Course[]
  personalTasks: PersonalTask[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>

  // Course mutations
  addCourse: (input: coursesApi.CourseInput) => Promise<void>
  updateCourse: (id: string, input: coursesApi.CourseInput) => Promise<void>
  setCourseArchived: (id: string, archived: boolean) => Promise<void>

  // Personal task mutations
  addPersonalTask: (input: tasksApi.PersonalTaskInput) => Promise<void>
  updatePersonalTask: (id: string, input: tasksApi.PersonalTaskInput) => Promise<void>
  deletePersonalTask: (id: string) => Promise<void>
  markPersonalTaskDone: (id: string) => Promise<void>
  updatePersonalTaskChecklist: (id: string, checklist: TaskChecklistItem[]) => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuthUser()

  const [courses, setCourses] = useState<Course[]>([])
  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!user) {
      setCourses([])
      setPersonalTasks([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [c, t] = await Promise.all([
        coursesApi.getCourses(),
        tasksApi.getPersonalTasks(),
      ])
      setCourses(c)
      setPersonalTasks(t)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load data'
      setError(message)
      console.error('[DataProvider]', message)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Load (or clear) data whenever the auth user changes
  useEffect(() => {
    if (authLoading) return
    refetch()
  }, [authLoading, refetch])

  // ── Course mutations ──
  const addCourse = useCallback(async (input: coursesApi.CourseInput) => {
    const created = await coursesApi.createCourse(input)
    setCourses((prev) => [...prev, created])
  }, [])

  const updateCourse = useCallback(async (id: string, input: coursesApi.CourseInput) => {
    const updated = await coursesApi.updateCourse(id, input)
    setCourses((prev) => prev.map((c) => (c.id === id ? updated : c)))
  }, [])

  const setCourseArchived = useCallback(async (id: string, archived: boolean) => {
    const updated = await coursesApi.setCourseArchived(id, archived)
    setCourses((prev) => prev.map((c) => (c.id === id ? updated : c)))
  }, [])

  // ── Personal task mutations ──
  const addPersonalTask = useCallback(async (input: tasksApi.PersonalTaskInput) => {
    const created = await tasksApi.createPersonalTask(input)
    setPersonalTasks((prev) => [...prev, created])
  }, [])

  const updatePersonalTask = useCallback(async (id: string, input: tasksApi.PersonalTaskInput) => {
    const updated = await tasksApi.updatePersonalTask(id, input)
    setPersonalTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
  }, [])

  const deletePersonalTask = useCallback(async (id: string) => {
    await tasksApi.deletePersonalTask(id)
    setPersonalTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const markPersonalTaskDone = useCallback(async (id: string) => {
    const updated = await tasksApi.updatePersonalTask(id, { status: 'done', progress: 100 })
    setPersonalTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
  }, [])

  const updatePersonalTaskChecklist = useCallback(
    async (id: string, checklist: TaskChecklistItem[]) => {
      // Optimistic update for snappy checklist toggling
      setPersonalTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, checklist } : t))
      )
      try {
        await tasksApi.updatePersonalTaskChecklist(id, checklist)
      } catch (e) {
        console.error('[DataProvider] checklist update failed, refetching', e)
        refetch()
      }
    },
    [refetch]
  )

  return (
    <DataContext.Provider
      value={{
        courses,
        personalTasks,
        loading,
        error,
        refetch,
        addCourse,
        updateCourse,
        setCourseArchived,
        addPersonalTask,
        updatePersonalTask,
        deletePersonalTask,
        markPersonalTaskDone,
        updatePersonalTaskChecklist,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside <DataProvider>')
  return ctx
}
