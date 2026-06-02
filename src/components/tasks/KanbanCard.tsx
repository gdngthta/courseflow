'use client'

import { Calendar, GripVertical, Lock } from 'lucide-react'
import { TypeBadge, RiskBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatDueDate } from '@/lib/utils'
import type { TaskCardData, TaskStatus } from '@/types'

interface KanbanCardProps {
  task: TaskCardData
  readOnly: boolean
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onOpen: () => void
  onStatusChange: (newStatus: TaskStatus) => void
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
}

/**
 * Compact task card for the Kanban board. Shows the same info as
 * TaskCard but in a denser format suited to column layout.
 *
 * Two ways to change status:
 *   1. Drag the card to another column (desktop, HTML5 native DnD).
 *   2. Pick from the status select at the bottom of the card (works
 *      everywhere including touch devices).
 *
 * Both routes call the same onStatusChange handler in KanbanBoard.
 */
export function KanbanCard({
  task,
  readOnly,
  isDragging,
  onDragStart,
  onDragEnd,
  onOpen,
  onStatusChange,
}: KanbanCardProps) {
  return (
    <div
      draggable={!readOnly}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      onDragStart={(e) => {
        if (readOnly) {
          e.preventDefault()
          return
        }
        e.dataTransfer.setData('text/plain', task.id)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      title={readOnly ? 'Read-only — project is completed' : 'Click to view details · drag to move'}
      className={`group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 transition-all cursor-pointer ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
      } ${readOnly ? '' : 'hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm'}`}
    >
      {/* Header: grip handle + title — clicking anywhere on the card opens
          the detail drawer; the grip is a visual cue that the card is draggable. */}
      <div className="flex items-start gap-2 mb-2">
        {!readOnly && (
          <GripVertical
            size={13}
            className="text-slate-300 dark:text-slate-600 flex-shrink-0 mt-0.5 group-hover:text-slate-400 dark:group-hover:text-slate-500 transition-colors cursor-grab active:cursor-grabbing"
            aria-hidden
          />
        )}
        <p className="flex-1 text-sm font-medium text-slate-900 dark:text-white leading-snug line-clamp-2 min-w-0">
          {task.title}
        </p>
        {readOnly && (
          <Lock size={11} className="text-slate-400 flex-shrink-0 mt-1" />
        )}
      </div>

      {/* Source label */}
      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2 pl-1">
        {task.source_label}
      </p>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2 pl-1">
        <TypeBadge type={task.type} />
        {task.risk !== 'completed' && <RiskBadge risk={task.risk} />}
      </div>

      {/* Due + progress */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2 pl-1">
        <Calendar size={11} className="flex-shrink-0" />
        <span className="truncate">{formatDueDate(task.due_date)}</span>
      </div>
      <div className="pl-1">
        <ProgressBar value={task.progress} />
        <p className="text-[10px] text-slate-500 mt-1">{task.progress}%</p>
      </div>

      {/* Status select (touch-friendly fallback) */}
      {!readOnly && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
            Move to
          </label>
          <select
            value={task.status}
            onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-xs px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition"
          >
            {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([value, label]) => (
              <option key={value} value={value} className="bg-white dark:bg-slate-800">
                {label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
