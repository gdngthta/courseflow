'use client'

import { Calendar, Users, ArrowRight } from 'lucide-react'
import { RiskBadge, RoleBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatDueDate } from '@/lib/utils'
import type { ProjectCardData } from '@/types'

interface ProjectCardProps {
  project: ProjectCardData
  onClick: (project: ProjectCardData) => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 hover:border-slate-600 transition-colors">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <RoleBadge role={project.user_role} />
          <RiskBadge risk={project.risk} />
        </div>
      </div>

      {/* Name + course */}
      <div>
        <h3 className="text-sm font-semibold text-white leading-snug">{project.name}</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          {project.course_code} — {project.course_name}
        </p>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Calendar size={11} />
          {formatDueDate(project.deadline)}
        </span>
        <span className="flex items-center gap-1">
          <Users size={11} />
          {project.member_count} member{project.member_count !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-slate-400">Project Progress</span>
          <span className="text-xs font-semibold text-white">{project.progress}%</span>
        </div>
        <ProgressBar value={project.progress} />
      </div>

      {/* Open button */}
      <button
        onClick={() => onClick(project)}
        className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-sm text-slate-200 rounded-lg transition-colors mt-auto"
      >
        Open Project
        <ArrowRight size={14} />
      </button>
    </div>
  )
}
