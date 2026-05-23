'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { CreateProjectModal, type CreateProjectData } from '@/components/projects/CreateProjectModal'
import { NoProjectsEmpty } from '@/components/ui/EmptyState'
import { getMockProjectCards, MOCK_COURSES } from '@/data/mock'
import type { ProjectCardData } from '@/types'

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectCardData[]>(getMockProjectCards())
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('all')

  // Only non-archived courses in filter dropdown
  const activeCourses = MOCK_COURSES.filter((c) => !c.is_archived)
  const courseFilterOptions = [
    { value: 'all', label: 'All Courses' },
    ...activeCourses.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })),
  ]

  const filtered = useMemo(() => {
    let result = projects.filter((p) => p.status === activeTab)
    if (selectedCourse !== 'all') {
      const course = MOCK_COURSES.find((c) => c.id === selectedCourse)
      if (course) result = result.filter((p) => p.course_code === course.code)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.course_name.toLowerCase().includes(q))
    }
    return result
  }, [projects, activeTab, searchQuery, selectedCourse])

  const activeCount = projects.filter((p) => p.status === 'active').length
  const completedCount = projects.filter((p) => p.status === 'completed').length

  const handleCreate = (data: CreateProjectData) => {
    const course = MOCK_COURSES.find((c) => c.id === data.course_id)
    const newProject: ProjectCardData = {
      id: `proj-${Date.now()}`,
      name: data.name,
      course_code: course?.code ?? '',
      course_name: course?.name ?? '',
      deadline: data.deadline,
      member_count: 1,
      user_role: 'leader',
      progress: 0,
      risk: 'safe',
      status: 'active',
    }
    setProjects((prev) => [newProject, ...prev])
  }

  return (
    <>
      <Topbar title="Projects" />
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Projects</h2>
            <p className="text-sm text-slate-400 mt-0.5">Shared workspaces for group assignments and projects.</p>
          </div>
          {activeTab === 'active' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + Create Project
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-1 border border-slate-800 rounded-lg p-1 bg-slate-900">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'active' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'active' ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {activeCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'completed' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Completed / History
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'completed' ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {completedCount}
              </span>
            </button>
          </div>

          {/* Search + filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            >
              {courseFilterOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-800">{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={(p) => router.push(`/projects/${p.id}`)}
              />
            ))}
          </div>
        ) : (
          <NoProjectsEmpty onAdd={() => setShowCreateModal(true)} />
        )}
      </div>

      <CreateProjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        courses={activeCourses}
      />
    </>
  )
}
