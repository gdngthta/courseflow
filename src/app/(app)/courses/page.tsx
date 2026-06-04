'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { CourseCard } from '@/components/courses/CourseCard'
import { CourseFormModal, type CourseFormData } from '@/components/courses/CourseFormModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { NoCoursesEmpty, NoArchivedCoursesEmpty } from '@/components/ui/EmptyState'
import { useData } from '@/contexts/DataContext'
import type { Course } from '@/types'

export default function CoursesPage() {
  const { userId, courses, personalTasks, projects, loading, error, addCourse, updateCourse, setCourseArchived } = useData()

  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [archivingCourse, setArchivingCourse] = useState<Course | null>(null)

  const filtered = useMemo(() => {
    let result = courses.filter((c) => c.is_archived === (activeTab === 'archived'))
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
    }
    return result
  }, [courses, activeTab, searchQuery])

  /**
   * Per-course stats covering BOTH personal tasks (owned by the
   * current user) AND project tasks assigned to the current user
   * inside any of that course's projects. This is the user-relevant
   * lens — other members' project tasks aren't counted toward the
   * viewer's "what's on my plate for this course?" feeling.
   */
  const getCourseStats = (courseId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const weekOut = new Date()
    weekOut.setDate(weekOut.getDate() + 7)
    const weekOutISO = weekOut.toISOString().split('T')[0]

    const personalForCourse = personalTasks.filter((t) => t.course_id === courseId)
    const assignedProjectForCourse = projects
      .filter((p) => p.project.course_id === courseId)
      .flatMap((p) => p.tasks.filter((t) => t.assigned_to === userId))

    const all = [...personalForCourse, ...assignedProjectForCourse]
    const completed = all.filter((t) => t.status === 'done').length
    const incomplete = all.length - completed
    const upcoming7 = all.filter(
      (t) => t.status !== 'done' && t.due_date >= today && t.due_date <= weekOutISO
    ).length
    return { total: all.length, completed, incomplete, upcoming7 }
  }

  const getProjectCount = (courseId: string) =>
    projects.filter((pd) => pd.project.course_id === courseId).length

  const getNextDeadline = (courseId: string): string | undefined => {
    const today = new Date().toISOString().split('T')[0]
    const taskDates = personalTasks
      .filter((t) => t.course_id === courseId && t.due_date >= today && t.status !== 'done')
      .map((t) => t.due_date)
    const projectDates = projects
      .filter((pd) => pd.project.course_id === courseId && pd.project.deadline >= today)
      .map((pd) => pd.project.deadline)
    return [...taskDates, ...projectDates].sort()[0]
  }

  const handleAdd = async (data: CourseFormData) => {
    await addCourse({
      code: data.code,
      name: data.name,
      lecturer: data.lecturer || undefined,
      semester: data.semester || undefined,
      color: data.color,
    })
  }

  const handleEdit = async (data: CourseFormData) => {
    if (!editingCourse) return
    await updateCourse(editingCourse.id, {
      code: data.code,
      name: data.name,
      lecturer: data.lecturer || undefined,
      semester: data.semester || undefined,
      color: data.color,
    })
    setEditingCourse(null)
  }

  const handleArchive = async () => {
    if (!archivingCourse) return
    await setCourseArchived(archivingCourse.id, true)
    setArchivingCourse(null)
  }

  const handleUnarchive = async (course: Course) => {
    await setCourseArchived(course.id, false)
  }

  return (
    <>
      <Topbar title="Courses" />
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-white">My Courses</h2>
            <p className="text-sm text-slate-400 mt-0.5 hidden sm:block">Manage the courses you are taking this semester.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-shrink-0 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            + Add Course
          </button>
        </div>

        {/* Tabs + search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-1 border border-slate-800 rounded-lg p-1 bg-slate-900 self-start">
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
          <div className="relative flex-1 sm:min-w-48 sm:max-w-xs">
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

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-900/20 border border-red-800/40 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-slate-500">Loading courses…</div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                stats={getCourseStats(course.id)}
                projectCount={getProjectCount(course.id)}
                nextDeadline={getNextDeadline(course.id)}
                onEdit={(c) => setEditingCourse(c)}
                onArchive={(c) => setArchivingCourse(c)}
                onUnarchive={handleUnarchive}
              />
            ))}
          </div>
        ) : activeTab === 'archived' ? (
          <NoArchivedCoursesEmpty />
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
