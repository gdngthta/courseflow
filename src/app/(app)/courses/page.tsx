'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { CourseCard } from '@/components/courses/CourseCard'
import { CourseFormModal, type CourseFormData } from '@/components/courses/CourseFormModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { NoCoursesEmpty } from '@/components/ui/EmptyState'
import { useMockStore } from '@/store/mockStore'
import type { Course } from '@/types'

export default function CoursesPage() {
  const { state, dispatch } = useMockStore()

  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [archivingCourse, setArchivingCourse] = useState<Course | null>(null)

  const filtered = useMemo(() => {
    let result = state.courses.filter((c) => c.is_archived === (activeTab === 'archived'))
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
    }
    return result
  }, [state.courses, activeTab, searchQuery])

  const getTaskCount = (courseId: string) =>
    state.personalTasks.filter((t) => t.course_id === courseId && t.status !== 'done').length

  const getProjectCount = (courseId: string) =>
    state.projects.filter((p) => p.course_id === courseId).length

  const getNextDeadline = (courseId: string): string | undefined => {
    const today = new Date().toISOString().split('T')[0]
    const taskDates = state.personalTasks
      .filter((t) => t.course_id === courseId && t.due_date >= today && t.status !== 'done')
      .map((t) => t.due_date)
    const projectDates = state.projects
      .filter((p) => p.course_id === courseId && p.deadline >= today)
      .map((p) => p.deadline)
    return [...taskDates, ...projectDates].sort()[0]
  }

  const handleAdd = (data: CourseFormData) => {
    const newCourse: Course = {
      id: `c-${Date.now()}`,
      user_id: state.currentUser.id,
      code: data.code,
      name: data.name,
      lecturer: data.lecturer || undefined,
      semester: data.semester || undefined,
      color: data.color,
      is_archived: false,
      created_at: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_COURSE', course: newCourse })
  }

  const handleEdit = (data: CourseFormData) => {
    if (!editingCourse) return
    dispatch({
      type: 'UPDATE_COURSE',
      course: {
        ...editingCourse,
        code: data.code,
        name: data.name,
        lecturer: data.lecturer || undefined,
        semester: data.semester || undefined,
        color: data.color,
      },
    })
    setEditingCourse(null)
  }

  const handleArchive = () => {
    if (!archivingCourse) return
    dispatch({ type: 'SET_COURSE_ARCHIVED', id: archivingCourse.id, archived: true })
    setArchivingCourse(null)
  }

  const handleUnarchive = (course: Course) => {
    dispatch({ type: 'SET_COURSE_ARCHIVED', id: course.id, archived: false })
  }

  return (
    <>
      <Topbar title="Courses" />
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">My Courses</h2>
            <p className="text-sm text-slate-400 mt-0.5">Manage the courses you are taking this semester.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Add Course
          </button>
        </div>

        {/* Tabs + search */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-1 border border-slate-800 rounded-lg p-1 bg-slate-900">
            {(['active', 'archived'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                  activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                taskCount={getTaskCount(course.id)}
                projectCount={getProjectCount(course.id)}
                nextDeadline={getNextDeadline(course.id)}
                onEdit={(c) => setEditingCourse(c)}
                onArchive={(c) => setArchivingCourse(c)}
                onUnarchive={handleUnarchive}
              />
            ))}
          </div>
        ) : (
          <NoCoursesEmpty onAdd={() => setShowAddModal(true)} />
        )}
      </div>

      <CourseFormModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAdd}
      />

      <CourseFormModal
        open={!!editingCourse}
        onClose={() => setEditingCourse(null)}
        onSubmit={handleEdit}
        editingCourse={editingCourse}
      />

      <ConfirmModal
        open={!!archivingCourse}
        onClose={() => setArchivingCourse(null)}
        onConfirm={handleArchive}
        title="Archive Course"
        description={`Archive "${archivingCourse?.name}"? Existing tasks and projects will remain saved, but the course will be hidden from active planning views.`}
        confirmLabel="Archive"
      />
    </>
  )
}
