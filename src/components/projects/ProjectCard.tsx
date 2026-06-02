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

      {/* Task totals */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <Stat label="Total" value={project.total_tasks} />
        <Stat label="Done" value={project.completed_tasks} accent="emerald" />
        <Stat label="To do" value={project.incomplete_tasks} accent={project.incomplete_tasks > 0 ? 'indigo' : undefined} />
      </div>
      {project.assigned_to_me > 0 && !isCompleted && (
        <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
          <span className="text-indigo-600 dark:text-indigo-400 font-medium">{project.assigned_to_me}</span>
          {' '}assigned to you
        </p>
      )}

      {/* Progress */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Project Progress{' '}
            <span className="text-slate-400" title="Project progress = completed project tasks ÷ total project tasks × 100.">ⓘ</span>
          </span>
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

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: 'emerald' | 'indigo'
}) {
  const accentCls =
    accent === 'emerald'
      ? 'text-emerald-600 dark:text-emerald-400'
      : accent === 'indigo'
        ? 'text-indigo-600 dark:text-indigo-400'
        : 'text-slate-900 dark:text-white'
  return (
    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-2.5 py-2 flex flex-col items-start">
      <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`text-sm font-semibold ${accentCls}`}>{value}</span>
    </div>
  )
}
