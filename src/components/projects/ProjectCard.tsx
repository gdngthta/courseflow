'use client'

import { Calendar, Users, ArrowRight, CheckCircle2 } from 'lucide-react'
import { RiskBadge, RoleBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatDueDate } from '@/lib/utils'
import type { ProjectCardData } from '@/types'

interface ProjectCardProps {
  project: ProjectCardData
  onClick: (project: ProjectCardData) => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const isCompleted = project.status === 'completed'

  return (
    <div className={`bg-white dark:bg-slate-900 border rounded-xl p-5 flex flex-col gap-4 hover:border-slate-400 dark:hover:border-slate-600 transition-colors ${isCompleted ? 'border-slate-300 dark:border-slate-700 opacity-90' : 'border-slate-200 dark:border-slate-800'}`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <RoleBadge role={project.user_role} />
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900/40 text-emerald-400 border border-emerald-800/50">
              <CheckCircle2 size={10} />
              Completed
            </span>
          ) : (
            <RiskBadge risk={project.risk} />
          )}
        </div>
      </div>

      {/* Name + course */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">{project.name}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {project.course_code} — {project.course_name}
        </p>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Calendar size={11} />
          {isCompleted && project.completed_at
            ? <>Completed {formatDueDate(project.completed_at)}</>
            : formatDueDate(project.deadline)
          }
        </span>
        <span className="flex items-center gap-1">
          <Users size={11} />
          {project.member_count} member{project.member_count !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-slate-500 dark:text-slate-400">Project Progress</span>
          <span className="text-xs font-semibold text-slate-900 dark:text-white">{project.progress}%</span>
        </div>
        <ProgressBar value={project.progress} />
      </div>

      {/* Action button */}
      <button
        onClick={() => onClick(project)}
        className={`flex items-center justify-center gap-2 w-full py-2 border text-sm rounded-lg transition-colors mt-auto ${
          isCompleted
            ? 'bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200'
        }`}
      >
        {isCompleted ? 'View History' : 'Open Project'}
        <ArrowRight size={14} />
      </button>
    </div>
  )
}
