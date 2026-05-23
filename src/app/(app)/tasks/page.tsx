'use client'

import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { TaskFormModal, type TaskFormData } from '@/components/tasks/TaskFormModal'
import { NoTasksEmpty } from '@/components/ui/EmptyState'
import { getMockTaskCards, MOCK_COURSES, MOCK_MEMBERS } from '@/data/mock'
import { calculateRisk } from '@/lib/risk'
import type { TaskCardData } from '@/types'

type Tab = 'all' | 'personal' | 'assigned' | 'critical' | 'completed'

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'personal', label: 'Personal' },
  { id: 'assigned', label: 'Assigned to Me' },
  { id: 'critical', label: 'Critical' },
  { id: 'completed', label: 'Completed' },
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskCardData[]>(getMockTaskCards())
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState<TaskCardData | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskCardData | null>(null)

  const filteredTasks = useMemo(() => {
    let result = tasks

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
  }, [tasks, activeTab, selectedCourse, searchQuery])

  const handleCreate = (data: TaskFormData) => {
    const course = MOCK_COURSES.find((c) => c.id === data.course_id)
    const newTask: TaskCardData = {
      id: `pt-${Date.now()}`,
      title: data.title,
      type: 'personal',
      status: data.status,
      risk: calculateRisk({ status: data.status, due_date: data.due_date, progress: data.progress, difficulty: data.difficulty }),
      difficulty: data.difficulty,
      progress: data.progress,
      due_date: data.due_date,
      source_label: course ? `${course.code} — ${course.name}` : 'No course',
      course_id: data.course_id || undefined,
      notes: data.notes,
    }
    setTasks((prev) => [newTask, ...prev])
  }

  const handleEdit = (task: TaskCardData) => setEditingTask(task)

  const handleEditSubmit = (data: TaskFormData) => {
    const course = MOCK_COURSES.find((c) => c.id === data.course_id)
    setTasks((prev) =>
      prev.map((t) =>
        t.id === editingTask?.id
          ? {
              ...t,
              title: data.title,
              status: data.status,
              difficulty: data.difficulty,
              progress: data.progress,
              due_date: data.due_date,
              notes: data.notes,
              course_id: data.course_id || undefined,
              source_label: course ? `${course.code} — ${course.name}` : 'No course',
              risk: calculateRisk({ status: data.status, due_date: data.due_date, progress: data.progress, difficulty: data.difficulty }),
            }
          : t
      )
    )
    setEditingTask(null)
  }

  const handleDelete = (task: TaskCardData) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
  }

  const handleMarkDone = (task: TaskCardData) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, status: 'done', progress: 100, risk: 'completed' } : t
      )
    )
  }

  const activeCourses = MOCK_COURSES.filter((c) => !c.is_archived)

  const courseFilterOptions = [
    { value: 'all', label: 'All Courses' },
    ...activeCourses.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })),
  ]

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
