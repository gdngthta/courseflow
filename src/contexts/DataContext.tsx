'use client'

/**
 * Central data store for the authenticated user's courses, personal tasks,
 * and projects (with members, tasks, and links).
 *
 * All Supabase reads and writes go through this context. Pages never query
 * Supabase directly — they call the mutation helpers exposed here, which
 * update local state optimistically and write to Supabase in the background.
 * On write failure, the relevant refetch() is called to restore correct state.
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
import * as projectsApi from '@/lib/api/projects'
import * as projectTasksApi from '@/lib/api/projectTasks'
import * as projectMembersApi from '@/lib/api/projectMembers'
import type { ProjectWithRelations } from '@/lib/api/projects'
import type { InviteResult } from '@/lib/api/projectMembers'

interface DataContextValue {
  userId: string
  courses: Course[]
  personalTasks: PersonalTask[]
  projects: ProjectWithRelations[]
  loading: boolean
  projectsLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  refetchProjects: () => Promise<void>

  // Course mutations
  addCourse: (input: coursesApi.CourseInput) => Promise<void>
  updateCourse: (id: string, input: coursesApi.CourseInput) => Promise<void>
  setCourseArchived: (id: string, archived: boolean) => Promise<void>

  // Personal task mutations
  addPersonalTask: (input: tasksApi.PersonalTaskInput) => Promise<void>
  updatePersonalTask: (id: string, input: tasksApi.PersonalTaskInput) => Promise<void>
  deletePersonalTask: (id: string) => Promise<void>
  markPersonalTaskDone: (id: string) => Promise<void>
  updatePersonalTaskStatus: (id: string, status: tasksApi.PersonalTaskInput['status']) => Promise<void>
  updatePersonalTaskChecklist: (id: string, checklist: TaskChecklistItem[]) => Promise<void>

  // Project mutations
  createProject: (input: projectsApi.CreateProjectInput) => Promise<string>
  completeProject: (id: string) => Promise<void>
  reopenProject: (id: string) => Promise<void>
  addProjectTask: (input: projectTasksApi.ProjectTaskInput) => Promise<void>
  updateProjectTask: (id: string, update: projectTasksApi.ProjectTaskUpdate) => Promise<void>
  deleteProjectTask: (id: string) => Promise<void>
  markProjectTaskDone: (id: string) => Promise<void>
  updateProjectTaskNotes: (id: string, notes: string) => Promise<void>
  updateProjectTaskChecklist: (id: string, checklist: TaskChecklistItem[]) => Promise<void>
  inviteMember: (projectId: string, email: string, role: 'member' | 'admin') => Promise<InviteResult>
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuthUser()
  const userId = user?.id ?? ''

  const [courses, setCourses] = useState<Course[]>([])
  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([])
  const [projects, setProjects] = useState<ProjectWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([])
      setProjectsLoading(false)
      return
    }
    try {
      const p = await projectsApi.getProjectsWithRelations()
      setProjects(p)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load projects'
      setError(message)
      console.error('[DataProvider]', message)
    } finally {
      setProjectsLoading(false)
    }
  }, [user])

  const refetch = useCallback(async () => {
    if (!user) {
      setCourses([])
      setPersonalTasks([])
      setProjects([])
      setLoading(false)
      setProjectsLoading(false)
      return
    }
    setLoading(true)
    setProjectsLoading(true)
    setError(null)
    try {
      const [c, t, p] = await Promise.all([
        coursesApi.getCourses(),
        tasksApi.getPersonalTasks(),
        projectsApi.getProjectsWithRelations(),
      ])
      setCourses(c)
      setPersonalTasks(t)
      setProjects(p)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load data'
      setError(message)
      console.error('[DataProvider]', message)
    } finally {
      setLoading(false)
      setProjectsLoading(false)
    }
  }, [user])

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

  /**
   * Partial-status update used by the Kanban board. Optimistic — flips
   * local state immediately, writes to Supabase in the background,
   * refetches if the write fails. Mirrors the project-task helper but
   * exists here because tasksApi.updatePersonalTask demands a full input
   * shape and we only want to change the status field.
   *
   * When moving to 'done' we also stamp progress=100; when moving OUT
   * of 'done' we leave progress alone so the user's manual number
   * isn't clobbered.
   */
  const updatePersonalTaskStatus = useCallback(
    async (id: string, status: tasksApi.PersonalTaskInput['status']) => {
      const goingToDone = status === 'done'
      setPersonalTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status, ...(goingToDone ? { progress: 100 } : {}) } : t
        )
      )
      try {
        await tasksApi.updatePersonalTask(id, goingToDone ? { status, progress: 100 } : { status })
      } catch (e) {
        console.error('[DataProvider] personal task status update failed, refetching', e)
        refetch()
      }
    },
    [refetch]
  )

  const updatePersonalTaskChecklist = useCallback(
    async (id: string, checklist: TaskChecklistItem[]) => {
      // Phase 5G #2: when a checklist exists, progress is derived from it
      // (completed items / total × 100). The manual progress slider only
      // applies when there's no checklist. We persist both fields so
      // downstream risk calculations stay consistent with what the user sees.
      const derivedProgress = checklist.length > 0
        ? Math.round((checklist.filter((i) => i.done).length / checklist.length) * 100)
        : undefined

      setPersonalTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, checklist, ...(derivedProgress !== undefined ? { progress: derivedProgress } : {}) }
            : t
        )
      )
      try {
        await tasksApi.updatePersonalTaskChecklist(id, checklist)
        if (derivedProgress !== undefined) {
          await tasksApi.updatePersonalTask(id, { progress: derivedProgress })
        }
      } catch (e) {
        console.error('[DataProvider] checklist update failed, refetching', e)
        refetch()
      }
    },
    [refetch]
  )

  // ── Project mutations ──
  const createProject = useCallback(async (input: projectsApi.CreateProjectInput) => {
    const id = await projectsApi.createProject(input)
    await refetchProjects()
    return id
  }, [refetchProjects])

  const completeProject = useCallback(async (id: string) => {
    const today = new Date().toISOString().split('T')[0]
    await projectsApi.completeProject(id, today)
    await refetchProjects()
  }, [refetchProjects])

  const reopenProject = useCallback(async (id: string) => {
    await projectsApi.reopenProject(id)
    await refetchProjects()
  }, [refetchProjects])

  const addProjectTask = useCallback(async (input: projectTasksApi.ProjectTaskInput) => {
    await projectTasksApi.createProjectTask(input)
    await refetchProjects()
  }, [refetchProjects])

  const updateProjectTask = useCallback(async (id: string, update: projectTasksApi.ProjectTaskUpdate) => {
    await projectTasksApi.updateProjectTask(id, update)
    await refetchProjects()
  }, [refetchProjects])

  const deleteProjectTask = useCallback(async (id: string) => {
    await projectTasksApi.deleteProjectTask(id)
    await refetchProjects()
  }, [refetchProjects])

  const markProjectTaskDone = useCallback(async (id: string) => {
    await projectTasksApi.updateProjectTask(id, { status: 'done', progress: 100 })
    await refetchProjects()
  }, [refetchProjects])

  const updateProjectTaskNotes = useCallback(async (id: string, notes: string) => {
    await projectTasksApi.updateProjectTaskNotes(id, notes)
    await refetchProjects()
  }, [refetchProjects])

  // Optimistic patch of a single task's checklist within the nested structure
  const updateProjectTaskChecklist = useCallback(
    async (id: string, checklist: TaskChecklistItem[]) => {
      // Phase 5G #2: derive progress from checklist when one exists,
      // so the project progress bar and task risk match what the user
      // toggled. Mirrors the personal-task path.
      const derivedProgress = checklist.length > 0
        ? Math.round((checklist.filter((i) => i.done).length / checklist.length) * 100)
        : undefined

      setProjects((prev) =>
        prev.map((pd) => ({
          ...pd,
          tasks: pd.tasks.map((t) =>
            t.id === id
              ? { ...t, checklist, ...(derivedProgress !== undefined ? { progress: derivedProgress } : {}) }
              : t
          ),
        }))
      )
      try {
        await projectTasksApi.updateProjectTaskChecklist(id, checklist)
        if (derivedProgress !== undefined) {
          await projectTasksApi.updateProjectTask(id, { progress: derivedProgress })
        }
      } catch (e) {
        console.error('[DataProvider] project checklist update failed, refetching', e)
        refetchProjects()
      }
    },
    [refetchProjects]
  )

  const inviteMember = useCallback(
    async (projectId: string, email: string, role: 'member' | 'admin') => {
      const result = await projectMembersApi.inviteMember(projectId, email, role)
      if (result.ok) await refetchProjects()
      return result
    },
    [refetchProjects]
  )

  return (
    <DataContext.Provider
      value={{
        userId,
        courses,
        personalTasks,
        projects,
        loading,
        projectsLoading,
        error,
        refetch,
        refetchProjects,
        addCourse,
        updateCourse,
        setCourseArchived,
        addPersonalTask,
        updatePersonalTask,
        deletePersonalTask,
        markPersonalTaskDone,
        updatePersonalTaskStatus,
        updatePersonalTaskChecklist,
        createProject,
        completeProject,
        reopenProject,
        addProjectTask,
        updateProjectTask,
        deleteProjectTask,
        markProjectTaskDone,
        updateProjectTaskNotes,
        updateProjectTaskChecklist,
        inviteMember,
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
