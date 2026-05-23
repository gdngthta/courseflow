'use client'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { TaskCardData } from '@/types'

interface CompleteProjectModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  unfinishedTasks: TaskCardData[]
}

export function CompleteProjectModal({
  open,
  onClose,
  onConfirm,
  unfinishedTasks,
}: CompleteProjectModalProps) {
  const hasUnfinished = unfinishedTasks.length > 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={hasUnfinished ? 'This project still has unfinished tasks.' : 'Mark project as completed?'}
      maxWidth="max-w-md"
    >
      {hasUnfinished ? (
        <>
          <p className="text-sm text-slate-300 mb-4">
            If you continue, the project will move to{' '}
            <span className="text-white font-medium">Completed Projects / History</span>, but
            unfinished tasks will remain visible in project history.
          </p>

          {/* List unfinished tasks */}
          <div className="bg-slate-800 rounded-lg p-3 mb-5 space-y-1.5">
            <p className="text-xs font-medium text-slate-400 mb-2">
              Unfinished tasks ({unfinishedTasks.length}):
            </p>
            {unfinishedTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                <p className="text-xs text-slate-300 truncate">{t.title}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={onConfirm}>Mark as Completed Anyway</Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-300 mb-6">
            All project tasks are completed. This project will move to{' '}
            <span className="text-white font-medium">Completed Projects / History</span>.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={onConfirm}>Mark as Completed</Button>
          </div>
        </>
      )}
    </Modal>
  )
}
