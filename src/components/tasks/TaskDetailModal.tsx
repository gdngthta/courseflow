'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, User, ExternalLink, CheckSquare, Square, Pencil, Check, X as XClose } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { TypeBadge, RiskBadge, StatusBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { DifficultyIndicator } from '@/components/ui/DifficultyIndicator'
import { formatFullDate } from '@/lib/utils'
import type { TaskCardData, TaskChecklistItem, ProjectRole } from '@/types'

interface TaskDetailModalProps {
  task: TaskCardData | null
  open: boolean
  onClose: () => void
  onEdit?: (task: TaskCardData) => void
  onDelete?: (task: TaskCardData) => void
  onMarkDone?: (task: TaskCardData) => void
  onUpdateNotes?: (task: TaskCardData, notes: string) => void
  onChecklistUpdate?: (taskId: string, checklist: TaskChecklistItem[]) => void
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
  onUpdateNotes,
  onChecklistUpdate,
  userRole,
  assigneeName,
}: TaskDetailModalProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [checklist, setChecklist] = useState<TaskChecklistItem[]>([])
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')
  // Controls CSS entry animation: false = off-screen, true = slid in
  const [isEntered, setIsEntered] = useState(false)

  // Slide-in animation on open
  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => setIsEntered(true))
      return () => cancelAnimationFrame(raf)
    } else {
      setIsEntered(false)
    }
  }, [open])

  // Sync task data when task changes
  useEffect(() => {
    if (task) {
      setChecklist(task.checklist ? task.checklist.map((item) => ({ ...item })) : [])
      setNotesValue(task.notes ?? '')
      setEditingNotes(false)
    }
  }, [task?.id, open])

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Escape key closes drawer
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null
  if (!task) return null

  const isGroupTask = task.type === 'group'
  const canEdit = !isGroupTask || userRole === 'leader' || userRole === 'admin'
  const canDelete = !isGroupTask || userRole === 'leader' || userRole === 'admin'
  const canEditNotes = isGroupTask && (userRole === 'leader' || userRole === 'admin')
  const doneCount = checklist.filter((i) => i.done).length
  const hasActions = (canDelete && onDelete) || (task.status !== 'done' && onMarkDone) || (canEdit && onEdit)

  const handleDelete = () => {
    setShowConfirm(false)
    onDelete?.(task)
    onClose()
  }

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) => {
      const updated = prev.map((item) => item.id === id ? { ...item, done: !item.done } : item)
      if (task) onChecklistUpdate?.(task.id, updated)
      return updated
    })
  }

  const handleSaveNotes = () => {
    onUpdateNotes?.(task, notesValue)
    setEditingNotes(false)
  }

  const handleCancelNotesEdit = () => {
    setNotesValue(task.notes ?? '')
    setEditingNotes(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isEntered ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex flex-col w-[600px] max-w-[92vw] bg-slate-900 border-l border-slate-800 shadow-2xl transition-transform duration-300 ease-out ${isEntered ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
      >
        {/* ── Sticky header ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Task Details</p>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-6 py-5 space-y-6">

            {/* Title + source */}
            <div>
              <h3 className="text-lg font-semibold text-white leading-snug">{task.title}</h3>
              <p className="text-sm text-slate-400 mt-1">{task.source_label}</p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              <TypeBadge type={task.type} />
              <RiskBadge risk={task.risk} />
              <StatusBadge status={task.status} />
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1.5">Due Date</p>
                <div className="flex items-center gap-1.5 text-sm text-slate-200">
                  <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                  {formatFullDate(task.due_date)}
                </div>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1.5">Difficulty</p>
                <DifficultyIndicator level={task.difficulty} showLabel />
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Progress</p>
                <span className="text-sm font-semibold text-white">{task.progress}%</span>
              </div>
              <ProgressBar value={task.progress} />
            </div>

            {/* Instructions / Notes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Instructions / Notes</p>
                {canEditNotes && !editingNotes && (
                  <button
                    onClick={() => setEditingNotes(true)}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <Pencil size={11} />
                    Edit
                  </button>
                )}
              </div>

              {editingNotes ? (
                <div className="space-y-2">
                  <textarea
                    rows={5}
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-indigo-500/50 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:border-indigo-500 focus:ring-indigo-500 transition resize-none"
                    placeholder="Add instructions or notes for the assigned member..."
                    autoFocus
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={handleCancelNotesEdit}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors rounded-md hover:bg-slate-700"
                    >
                      <XClose size={11} /> Cancel
                    </button>
                    <button
                      onClick={handleSaveNotes}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors rounded-md hover:bg-slate-700"
                    >
                      <Check size={11} /> Save
                    </button>
                  </div>
                </div>
              ) : notesValue ? (
                <p className="text-sm text-slate-300 bg-slate-800 rounded-lg p-4 leading-relaxed whitespace-pre-line">
                  {notesValue}
                </p>
              ) : (
                <p className="text-sm text-slate-500 bg-slate-800 rounded-lg p-4 italic">
                  No instructions provided for this task.
                </p>
              )}
            </div>

            {/* Resources / Links */}
            {task.links && task.links.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Resources</p>
                <div className="bg-slate-800 rounded-lg px-4 py-3 space-y-2">
                  {task.links.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <ExternalLink size={13} className="flex-shrink-0 text-slate-500" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Checklist */}
            {checklist.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Checklist</p>
                  <span className="text-xs text-slate-500">{doneCount} / {checklist.length} done</span>
                </div>
                {/* Mini progress bar */}
                <div className="h-1 bg-slate-700 rounded-full mb-3 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: checklist.length > 0 ? `${Math.round((doneCount / checklist.length) * 100)}%` : '0%' }}
                  />
                </div>
                <div className="space-y-0.5">
                  {checklist.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id)}
                      className="flex items-start gap-3 w-full text-left group py-1.5 px-2 rounded-md hover:bg-slate-800 transition-colors"
                    >
                      {item.done
                        ? <CheckSquare size={15} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                        : <Square size={15} className="text-slate-500 flex-shrink-0 mt-0.5 group-hover:text-slate-400 transition-colors" />
                      }
                      <span className={`text-sm leading-snug transition-colors ${item.done ? 'text-slate-500 line-through' : 'text-slate-300 group-hover:text-slate-200'}`}>
                        {item.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Assigned to */}
            {isGroupTask && assigneeName && (
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Assigned To</p>
                <div className="flex items-center gap-3 bg-slate-800 rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-white" />
                  </div>
                  <span className="text-sm text-slate-200">{assigneeName}</span>
                </div>
              </div>
            )}

            {/* Bottom padding so last item clears the sticky footer */}
            <div className="h-2" />
          </div>
        </div>

        {/* ── Sticky footer (actions) ── */}
        {hasActions && (
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900">
            <div>
              {canDelete && onDelete && (
                <Button variant="destructive" size="sm" onClick={() => setShowConfirm(true)}>
                  Delete
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {task.status !== 'done' && onMarkDone && (
                <Button variant="secondary" size="sm" onClick={() => { onMarkDone(task); onClose() }}>
                  Mark as Done
                </Button>
              )}
              {canEdit && onEdit && (
                <Button variant="primary" size="sm" onClick={() => { onEdit(task); onClose() }}>
                  Edit Task
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm (stays as a centered modal on top of drawer) */}
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
