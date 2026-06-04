'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, LayoutGrid, List } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { TaskFormModal, type TaskFormData } from '@/components/tasks/TaskFormModal'
import { KanbanBoard } from '@/components/tasks/KanbanBoard'
import { CourseSelectorStrip } from '@/components/tasks/CourseSelectorStrip'
import { CourseDetailHeader } from '@/components/tasks/CourseDetailHeader'
import { UpcomingDeadlineSummary } from '@/components/tasks/UpcomingDeadlineSummary'
import { NoTasksEmpty } from '@/components/ui/EmptyState'
import { useData } from '@/contexts/DataContext'
import { toAllTaskCards } from '@/lib/taskDerive'
import { toCourseStats, getDeadlineSummary } from '@/lib/courseDerive'
import type { TaskCardData, TaskChecklistItem } from '@/types'

type Tab = 'all' | 'personal' | 'assigned' | 'critical' | 'completed'

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'personal', label: 'Personal' },
  { id: 'assigned', label: 'Assigned to Me' },
  { id: 'critical', label: 'Critical' },
  { id: 'completed', label: 'Completed' },
]

export default function TasksPage() {
  const {
    userId,
    courses,
    personalTasks,
    projects,
    loading,
    error,
    addPersonalTask,
    updatePersonalTask,
    deletePersonalTask,
    markPersonalTaskDone,
    updatePersonalTaskChecklist,
    markProjectTaskDone,
    updateProjectTaskChecklist,
  } = useData()

  const [activeTab, setActiveTab] = useState<Tab>('all')
  /** null = "All Courses" view */
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState<TaskCardData | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskCardData | null>(null)
  const [view, setView] = useState<'list' | 'board'>('list')

  // Combine personal tasks + assigned group tasks (no duplication).
  const allTasks = useMemo(
    () => toAllTaskCards(personalTasks, courses, projects, userId),
    [personalTasks, courses, projects, userId]
  )

  // Per-course statistics for the course selector strip.
  const courseStats = useMemo(
    () => toCourseStats(courses, allTasks, projects),
    [courses, allTasks, projects]
  )

  /**
   * Deep-link support: if the URL contains `?task=<id>` (e.g. coming
   * from a Dashboard click), find that task once data has loaded and
   * open the detail drawer. Strip the query param afterwards.
   *
   * We read from `window.location.search` directly instead of
   * useSearchParams() to avoid the Next.js prerender-vs-Suspense
   * requirement on client components.
   */
  useEffect(() => {
    if (loading || typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const requestedTaskId = params.get('task')
    if (!requestedTaskId) return
    const match = allTasks.find((t) => t.id === requestedTaskId)
    if (match) {
      setSelectedTask(match)
      window.history.replaceState({}, '', window.location.pathname)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, allTasks])

  // Archived course ids — used to filter tasks in "All Courses" view.
  const archivedCourseIds = useMemo(
    () => new Set(courses.filter((c) => c.is_archived).map((c) => c.id)),
    [courses]
  )

  const filteredTasks = useMemo(() => {
    let result = allTasks

    // When a specific course is selected, show only its tasks.
    if (selectedCourseId !== null) {
      result = result.filter((t) => t.course_id === selectedCourseId)
    } else if (!showArchived) {
      // "All Courses" view: hide tasks from archived courses by default.
      result = result.filter((t) => !t.course_id || !archivedCourseIds.has(t.course_id))
    }

    // Tab filter.
    if (activeTab === 'personal') result = result.filter((t) => t.type === 'personal')
    else if (activeTab === 'assigned') result = result.filter((t) => t.type === 'group')
    // Critical tab: never show completed tasks (done tasks can't be critical anyway,
    // but this guard makes the contract explicit and future-proof).
    else if (activeTab === 'critical') result = result.filter((t) => t.risk === 'critical' && t.status !== 'done')
    else if (activeTab === 'completed') result = result.filter((t) => t.status === 'done')

    // Search.
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.source_label.toLowerCase().includes(q)
      )
    }

    return result
  }, [allTasks, activeTab, selectedCourseId, showArchived, archivedCourseIds, searchQuery])

  // Today ISO — stable reference for sorting, deadline summary, and overdue checks.
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], [])

  /**
   * Sort filtered tasks so active work appears first and completed
   * tasks are pushed to the bottom.
   *
   * Within active tasks: critical → overdue → nearest due date → harder difficulty.
   * Within done tasks: most recently due first (already completed, keep brief).
   *
   * The "completed" and "critical" tabs have their own filter logic so
   * we skip re-sorting there — the list is already homogeneous.
   */
  const sortedTasks = useMemo(() => {
    if (activeTab === 'completed' || activeTab === 'critical') return filteredTasks

    return [...filteredTasks].sort((a, b) => {
      const aDone = a.status === 'done' ? 1 : 0
      const bDone = b.status === 'done' ? 1 : 0
      if (aDone !== bDone) return aDone - bDone

      // Both done → most-recently-due first (so recent completions show up top of the done group).
      if (aDone === 1) {
        return (b.due_date ?? '').localeCompare(a.due_date ?? '')
      }

      // Both active → critical first.
      const aCrit = a.risk === 'critical' ? 0 : 1
      const bCrit = b.risk === 'critical' ? 0 : 1
      if (aCrit !== bCrit) return aCrit - bCrit

      // Then overdue (due_date < today) before upcoming.
      const aOverdue = a.due_date && a.due_date < todayISO ? 0 : 1
      const bOverdue = b.due_date && b.due_date < todayISO ? 0 : 1
      if (aOverdue !== bOverdue) return aOverdue - bOverdue

      // Nearest due date first.
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
      if (a.due_date) return -1
      if (b.due_date) return 1

      // Harder tasks first when due date ties.
      return (b.difficulty ?? 0) - (a.difficulty ?? 0)
    })
  }, [filteredTasks, activeTab, todayISO])

  // Upcoming deadline summary for the filtered task set.
  const deadlineSummary = useMemo(
    () => getDeadlineSummary(filteredTasks, todayISO),
    [filteredTasks, todayISO]
  )

  // Task ids that are read-only on Kanban (completed project tasks).
  const readOnlyIds = useMemo(() => {
    const ids = new Set<string>()
    for (const p of projects) {
      if (p.project.status !== 'completed') continue
      for (const t of p.tasks) ids.add(t.id)
    }
    return ids
  }, [projects])

  // Only non-archived courses for the "New Task" form's course picker.
  const activeCourses = useMemo(() => courses.filter((c) => !c.is_archived), [courses])

  // Stats for the "All Courses" card.
  const allStats = useMemo(() => {
    const visibleTasks = showArchived
      ? allTasks
      : allTasks.filter((t) => !t.course_id || !archivedCourseIds.has(t.course_id))
    return {
      total_tasks: visibleTasks.length,
      incomplete_tasks: visibleTasks.filter((t) => t.status !== 'done').length,
    }
  }, [allTasks, showArchived, archivedCourseIds])

  // The CourseStats entry for the currently selected course.
  const selectedCourseStats = useMemo(
    () =>
      selectedCourseId !== null
        ? courseStats.find((c) => c.id === selectedCourseId) ?? null
        : null,
    [courseStats, selectedCourseId]
  )

  // ── Handlers ──

  const handleCreate = async (data: TaskFormData) => {
    await addPersonalTask({
      title: data.title,
      course_id: data.course_id || undefined,
      due_date: data.due_date,
      status: data.status,
      progress: data.progress,
      difficulty: data.difficulty,
      notes: data.notes || undefined,
      links: data.links,
      checklist: data.checklist.filter((i) => i.text.trim()),
    })
  }

  const handleEdit = (task: TaskCardData) => {
    if (task.type === 'personal') setEditingTask(task)
  }

  const handleEditSubmit = async (data: TaskFormData) => {
    if (!editingTask) return
    await updatePersonalTask(editingTask.id, {
      title: data.title,
      course_id: data.course_id || undefined,
      due_date: data.due_date,
      status: data.status,
      progress: data.progress,
      difficulty: data.difficulty,
      notes: data.notes || undefined,
      links: data.links,
      checklist: data.checklist.filter((i) => i.text.trim()),
    })
    setEditingTask(null)
  }

  const handleDelete = async (task: TaskCardData) => {
    if (task.type === 'personal') await deletePersonalTask(task.id)
  }

  const handleMarkDone = async (task: TaskCardData) => {
    if (task.type === 'personal') await markPersonalTaskDone(task.id)
    else await markProjectTaskDone(task.id)
  }

  const handleChecklistUpdate = (taskId: string, checklist: TaskChecklistItem[]) => {
    const isPersonal = personalTasks.some((t) => t.id === taskId)
    if (isPersonal) updatePersonalTaskChecklist(taskId, checklist)
    else updateProjectTaskChecklist(taskId, checklist)
  }

  const handleCourseSelect = (courseId: string | null) => {
    setSelectedCourseId(courseId)
    // Reset tab to "all" when switching courses so users don't get confused.
    setActiveTab('all')
    setSearchQuery('')
  }

  return (
    <>
      <Topbar title="My Tasks" />
      <div className="p-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-semibold text-white">My Tasks</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Manage your personal coursework and assigned group tasks.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + New Personal Task
          </button>
        </div>

        {/* ── Course selector strip ── */}
        {!loading && (
          <CourseSelectorStrip
            courseStats={courseStats}
            selectedCourseId={selectedCourseId}
            onSelect={handleCourseSelect}
            showArchived={showArchived}
            onToggleArchived={() => setShowArchived((v) => !v)}
            allStats={allStats}
          />
        )}

        {/* ── Course detail header (shown when a specific course is selected) ── */}
        {!loading && selectedCourseStats && (
          <CourseDetailHeader stats={selectedCourseStats} projects={projects} />
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4 border-b border-slate-800 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-indigo-400 border-indigo-400'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + view toggle */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <ViewToggle view={view} onChange={setView} />
          <div className="relative flex-1 min-w-48">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search tasks…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>
        </div>

        {/* Upcoming deadline summary */}
        {!loading && <UpcomingDeadlineSummary summary={deadlineSummary} />}

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-900/20 border border-red-800/40 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Task list / board */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-slate-500">
            Loading tasks…
          </div>
        ) : view === 'board' ? (
          sortedTasks.length > 0 ? (
            <KanbanBoard tasks={sortedTasks} readOnlyIds={readOnlyIds} />
          ) : (
            <NoTasksEmpty onAdd={() => setShowCreateModal(true)} />
          )
        ) : sortedTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedTasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={setSelectedTask} />
            ))}
          </div>
        ) : (
          <NoTasksEmpty onAdd={() => setShowCreateModal(true)} />
        )}
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMarkDone={handleMarkDone}
        onChecklistUpdate={handleChecklistUpdate}
      />

      <TaskFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        courses={activeCourses}
      />

      <TaskFormModal
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSubmit={handleEditSubmit}
        courses={activeCourses}
        editingTask={editingTask}
      />
    </>
  )
}

// ── View toggle ──

function ViewToggle({
  view,
  onChange,
}: {
  view: 'list' | 'board'
  onChange: (v: 'list' | 'board') => void
}) {
  const baseBtn = 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors'
  const activeCls = 'bg-indigo-600 text-white shadow-sm'
  const inactiveCls = 'text-slate-400 hover:text-slate-200'
  return (
    <div
      role="tablist"
      className="inline-flex items-center gap-1 p-1 bg-slate-800 border border-slate-700 rounded-lg"
    >
      <button
        role="tab"
        aria-selected={view === 'list'}
        onClick={() => onChange('list')}
        className={`${baseBtn} ${view === 'list' ? activeCls : inactiveCls}`}
      >
        <List size={12} /> List
      </button>
      <button
        role="tab"
        aria-selected={view === 'board'}
        onClick={() => onChange('board')}
        className={`${baseBtn} ${view === 'board' ? activeCls : inactiveCls}`}
      >
        <LayoutGrid size={12} /> Board
      </button>
    </div>
  )
}
