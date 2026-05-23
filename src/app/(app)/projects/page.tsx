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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('all')

  const courseFilterOptions = [
    { value: 'all', label: 'All Courses' },
    ...MOCK_COURSES.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })),
  ]

  const filtered = useMemo(() => {
    let result = projects
    if (selectedCourse !== 'all') {
      const course = MOCK_COURSES.find((c) => c.id === selectedCourse)
      if (course) result = result.filter((p) => p.course_code === course.code)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.course_name.toLowerCase().includes(q))
    }
    return result
  }, [projects, searchQuery, selectedCourse])

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
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Create Project
          </button>
        </div>

        {/* Search + filter */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-48">
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
        courses={MOCK_COURSES}
      />
    </>
  )
}
