'use client'

import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { TaskFormModal, type TaskFormData } from '@/components/tasks/TaskFormModal'
import { NoTasksEmpty } from '@/components/ui/EmptyState'
import { useMockStore, deriveTaskCards } from '@/store/mockStore'
import { MOCK_MEMBERS } from '@/data/mock'
import { calculateRisk } from '@/lib/risk'
import type { TaskCardData, PersonalTask, TaskChecklistItem } from '@/types'

type Tab = 'all' | 'personal' | 'assigned' | 'critical' | 'completed'

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'personal', label: 'Personal' },
  { id: 'assigned', label: 'Assigned to Me' },
  { id: 'critical', label: 'Critical' },
  { id: 'completed', label: 'Completed' },
]

export default function TasksPage() {
  const { state, dispatch } = useMockStore()

  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState<TaskCardData | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskCardData | null>(null)

  // Derive all task cards from shared state
  const allTasks = useMemo(() => deriveTaskCards(state), [state])

  const filteredTasks = useMemo(() => {
    let result = allTasks

    if (activeTab === 'personal') result = result.filter((t) => t.type === 'personal')
    else if (activeTab === 'assigned') result = result.filter((t) => t.type === 'group')
    else if (activeTab === 'critical') result = result.filter((t) => t.risk === 'critical')
    else if (activeTab === 'completed') result = result.filter((t) => t.status === 'done')

    if (selectedCourse !== 'all') result = result.filter((t) => t.course_id === selectedCourse)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((t) => t.title.toLowerCase().includes(q) || t.source_label.toLowerCase().includes(q))
    }

    return result
  }, [allTasks, activeTab, selectedCourse, searchQuery])

  // Only non-archived courses for dropdowns
  const activeCourses = useMemo(
    () => state.courses.filter((c) => !c.is_archived),
    [state.courses]
  )

  const courseFilterOptions = [
    { value: 'all', label: 'All Courses' },
    ...activeCourses.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })),
  ]

  // ── Handlers ──

  const handleCreate = (data: TaskFormData) => {
    const newTask: PersonalTask = {
      id: `pt-${Date.now()}`,
      user_id: state.currentUser.id,
      course_id: data.course_id || undefined,
      title: data.title,
      type: 'personal',
      status: data.status,
      difficulty: data.difficulty,
      progress: data.progress,
      due_date: data.due_date,
      notes: data.notes || undefined,
      links: data.links.length > 0 ? data.links : undefined,
      checklist: data.checklist.filter((i) => i.text.trim()).length > 0
        ? data.checklist.filter((i) => i.text.trim())
        : undefined,
      created_at: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_PERSONAL_TASK', task: newTask })
  }

  const handleEdit = (task: TaskCardData) => setEditingTask(task)

  const handleEditSubmit = (data: TaskFormData) => {
    if (!editingTask) return
    const existing = state.personalTasks.find((t) => t.id === editingTask.id)
    if (!existing) return
    const updated: PersonalTask = {
      ...existing,
      title: data.title,
      status: data.status,
      difficulty: data.difficulty,
      progress: data.progress,
      due_date: data.due_date,
      course_id: data.course_id || undefined,
      notes: data.notes || undefined,
      links: data.links.length > 0 ? data.links : undefined,
      checklist: data.checklist.filter((i) => i.text.trim()).length > 0
        ? data.checklist.filter((i) => i.text.trim())
        : undefined,
    }
    dispatch({ type: 'UPDATE_PERSONAL_TASK', task: updated })
    setEditingTask(null)
  }

  const handleDelete = (task: TaskCardData) => {
    // Only personal tasks have Delete from My Tasks (group tasks hide the button)
    dispatch({ type: 'DELETE_PERSONAL_TASK', id: task.id })
  }

  const handleMarkDone = (task: TaskCardData) => {
    if (task.type === 'personal') {
      const existing = state.personalTasks.find((t) => t.id === task.id)
      if (existing) {
        dispatch({ type: 'UPDATE_PERSONAL_TASK', task: { ...existing, status: 'done', progress: 100 } })
      }
    } else {
      const existing = state.projectTasks.find((t) => t.id === task.id)
      if (existing) {
        dispatch({ type: 'UPDATE_PROJECT_TASK', task: { ...existing, status: 'done', progress: 100 } })
      }
    }
  }

  const handleChecklistUpdate = (taskId: string, checklist: TaskChecklistItem[]) => {
    const isPersonal = state.personalTasks.some((t) => t.id === taskId)
    if (isPersonal) {
      dispatch({ type: 'UPDATE_PERSONAL_TASK_CHECKLIST', id: taskId, checklist })
    } else {
      dispatch({ type: 'UPDATE_PROJECT_TASK_CHECKLIST', id: taskId, checklist })
    }
  }

  return (
    <>
      <Topbar title="My Tasks" />
      <div className="p-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">My Tasks</h2>
            <p className="text-sm text-slate-400 mt-0.5">Manage your personal coursework and assigned group tasks.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + New Personal Task
          </button>
        </div>

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

        {/* Search + filter row */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>
          <div className="relative">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            >
              {courseFilterOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-800">
                  {opt.label}
                </option>
              ))}
            </select>
            <SlidersHorizontal size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Task grid */}
        {filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTasks.map((task) => (
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
        assigneeName={selectedTask?.assigned_to ? MOCK_MEMBERS[selectedTask.assigned_to]?.name : undefined}
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
