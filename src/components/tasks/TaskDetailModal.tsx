'use client'

import { useState } from 'react'
import { Calendar, User } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { TypeBadge, RiskBadge, StatusBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { DifficultyIndicator } from '@/components/ui/DifficultyIndicator'
import { formatFullDate } from '@/lib/utils'
import type { TaskCardData, ProjectRole } from '@/types'

interface TaskDetailModalProps {
  task: TaskCardData | null
  open: boolean
  onClose: () => void
  onEdit?: (task: TaskCardData) => void
  onDelete?: (task: TaskCardData) => void
  onMarkDone?: (task: TaskCardData) => void
  userRole?: ProjectRole
  assigneeName?: string
}

export function TaskDetailModal({
  task,
  open,
  onClose,
  onEdit,
  onDelete,
  onMarkDone,
  userRole,
  assigneeName,
}: TaskDetailModalProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  if (!task) return null

  const isGroupTask = task.type === 'group'
  const canEdit = !isGroupTask || userRole === 'leader' || userRole === 'admin'
  const canDelete = !isGroupTask || userRole === 'leader' || userRole === 'admin'

  const handleDelete = () => {
    setShowConfirm(false)
    onDelete?.(task)
    onClose()
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Task Details" maxWidth="max-w-md">
        {/* Title + source */}
        <div className="mb-4">
          <h3 className="text-base font-semibold text-white">{task.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{task.source_label}</p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          <TypeBadge type={task.type} />
          <RiskBadge risk={task.risk} />
          <StatusBadge status={task.status} />
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Due Date</p>
            <div className="flex items-center gap-1.5 text-sm text-slate-200">
              <Calendar size={13} className="text-slate-400" />
              {formatFullDate(task.due_date)}
            </div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Difficulty</p>
            <DifficultyIndicator level={task.difficulty} showLabel />
          </div>
        </div>

        {/* Progress */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400">Current Progress</p>
            <span className="text-sm font-semibold text-white">{task.progress}%</span>
          </div>
          <ProgressBar value={task.progress} />
        </div>

        {/* Notes */}
        {task.notes && (
          <div className="mb-5">
            <p className="text-xs text-slate-400 mb-2">Notes & Details</p>
            <p className="text-sm text-slate-300 bg-slate-800 rounded-lg p-3 leading-relaxed">
              {task.notes}
            </p>
          </div>
        )}

        {!task.notes && (
          <div className="mb-5">
            <p className="text-xs text-slate-400 mb-2">Notes & Details</p>
            <p className="text-xs text-slate-500 bg-slate-800 rounded-lg p-3">
              No additional notes provided for this task.
            </p>
          </div>
        )}

        {/* Assigned to (group tasks) */}
        {isGroupTask && assigneeName && (
          <div className="mb-5">
            <p className="text-xs text-slate-400 mb-2">Assigned To</p>
            <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-3">
              <div className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center flex-shrink-0">
                <User size={13} className="text-white" />
              </div>
              <span className="text-sm text-slate-200">{assigneeName}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <div>
            {canDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowConfirm(true)}
              >
                Delete Task
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {task.status !== 'done' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { onMarkDone?.(task); onClose() }}
              >
                Mark as Done
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            {canEdit && (
              <Button variant="primary" size="sm" onClick={() => { onEdit?.(task); onClose() }}>
                Edit Task
              </Button>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
      />
    </>
  )
}
