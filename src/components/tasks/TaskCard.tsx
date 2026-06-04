'use client'

import { Calendar, User } from 'lucide-react'
import { TypeBadge, RiskBadge, StatusBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { DifficultyIndicator } from '@/components/ui/DifficultyIndicator'
import { formatDueDate } from '@/lib/utils'
import type { TaskCardData } from '@/types'

interface TaskCardProps {
  task: TaskCardData
  onClick: (task: TaskCardData) => void
  /** Optional assignee display name shown on project tasks. */
  assigneeName?: string
}

export function TaskCard({ task, onClick, assigneeName }: TaskCardProps) {
  return (
    <div
      className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 cursor-pointer hover:border-slate-600 transition-colors group"
      onClick={() => onClick(task)}
    >
      {/* Top row — badges */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <TypeBadge type={task.type} />
          <RiskBadge risk={task.risk} />
        </div>
        <StatusBadge status={task.status} />
      </div>

      {/* Title + source */}
      <div>
        <p className="text-sm font-semibold text-white leading-snug group-hover:text-indigo-300 transition-colors">
          {task.title}
        </p>
        <p className="text-xs text-slate-400 mt-0.5 truncate">{task.source_label}</p>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Calendar size={11} />
          <span>{formatDueDate(task.due_date)}</span>
        </div>
        <DifficultyIndicator level={task.difficulty} />
      </div>

      {/* Assignee (group tasks only) */}
      {task.type === 'group' && assigneeName && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 -mt-1">
          <User size={11} className="flex-shrink-0" />
          <span className="truncate">
            Assigned to <span className="text-slate-200">{assigneeName}</span>
          </span>
        </div>
      )}

      {/* Progress */}
      <ProgressBar value={task.progress} showLabel />

      {/* Footer */}
      <button
        className="text-xs text-indigo-400 hover:text-indigo-300 text-left transition-colors mt-auto"
        onClick={(e) => { e.stopPropagation(); onClick(task) }}
      >
        View details →
      </button>
    </div>
  )
}
