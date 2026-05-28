'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, AlertTriangle, Clock, Calendar, X } from 'lucide-react'
import { useData } from '@/contexts/DataContext'
import {
  deriveNotifications,
  loadDismissed,
  addDismissed,
  dismissAll as dismissAllStore,
  type AppNotification,
  type NotificationType,
} from '@/lib/notifications'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import type { TaskCardData, TaskChecklistItem } from '@/types'

const ICON: Record<NotificationType, React.ComponentType<{ size?: number; className?: string }>> = {
  overdue: AlertTriangle,
  critical: AlertTriangle,
  due_today: Clock,
  due_tomorrow: Clock,
  project_deadline: Calendar,
}

const COLOR: Record<NotificationType, string> = {
  overdue: 'text-red-400',
  critical: 'text-red-400',
  due_today: 'text-amber-400',
  due_tomorrow: 'text-amber-400',
  project_deadline: 'text-emerald-400',
}

const LABEL: Record<NotificationType, string> = {
  overdue: 'Overdue',
  critical: 'Critical',
  due_today: 'Due today',
  due_tomorrow: 'Due tomorrow',
  project_deadline: 'Project deadline',
}

export function NotificationsPanel() {
  const router = useRouter()
  const { userId, courses, personalTasks, projects, updatePersonalTaskChecklist, updateProjectTaskChecklist } = useData()
  const [open, setOpen] = useState(false)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [selectedTask, setSelectedTask] = useState<TaskCardData | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Load dismissed state once on mount + whenever the panel opens
  // (cheap, picks up changes from other tabs).
  useEffect(() => {
    if (typeof window === 'undefined') return
    setDismissedIds(new Set(loadDismissed().map((e) => e.id)))
  }, [open])

  // Derive notifications fresh on every render — cheap, pure function.
  const allNotifications = useMemo(
    () => deriveNotifications({ userId, courses, personalTasks, projects }),
    [userId, courses, personalTasks, projects]
  )

  const visible = useMemo(
    () => allNotifications.filter((n) => !dismissedIds.has(n.id)),
    [allNotifications, dismissedIds]
  )

  // Click-outside + Escape
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const handleDismiss = useCallback((n: AppNotification, e: React.MouseEvent) => {
    e.stopPropagation()
    addDismissed(n)
    setDismissedIds((prev) => new Set(prev).add(n.id))
  }, [])

  const handleDismissAll = useCallback(() => {
    dismissAllStore(visible)
    setDismissedIds((prev) => {
      const next = new Set(prev)
      visible.forEach((n) => next.add(n.id))
      return next
    })
  }, [visible])

  const handleClick = useCallback(
    (n: AppNotification) => {
      if (n.task) {
        setSelectedTask(n.task)
      } else {
        router.push(n.href)
      }
      setOpen(false)
    },
    [router]
  )

  const handleChecklistUpdate = (taskId: string, checklist: TaskChecklistItem[]) => {
    const isPersonal = personalTasks.some((t) => t.id === taskId)
    if (isPersonal) updatePersonalTaskChecklist(taskId, checklist)
    else updateProjectTaskChecklist(taskId, checklist)
  }

  const unread = visible.length

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          title="Notifications"
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <Bell size={17} />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[1rem] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute top-full right-0 mt-2 w-[22rem] max-h-[28rem] bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <p className="text-sm font-semibold text-white">
                Notifications {unread > 0 && <span className="text-slate-500">({unread})</span>}
              </p>
              {unread > 0 && (
                <button
                  onClick={handleDismissAll}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Dismiss all
                </button>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {visible.length === 0 ? (
                <p className="px-4 py-8 text-xs text-slate-500 text-center">
                  No urgent notifications right now.
                </p>
              ) : (
                <ul>
                  {visible.map((n) => {
                    const Icon = ICON[n.type]
                    return (
                      <li
                        key={n.id}
                        className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800/60 transition-colors"
                      >
                        <div className="flex items-start gap-3 px-4 py-3">
                          <Icon size={14} className={`${COLOR[n.type]} flex-shrink-0 mt-0.5`} />
                          <button
                            onClick={() => handleClick(n)}
                            className="flex-1 text-left min-w-0"
                          >
                            <p className="text-xs text-slate-500 mb-0.5">{LABEL[n.type]}</p>
                            <p className="text-sm text-slate-200 truncate">{n.title}</p>
                            <p className="text-xs text-slate-500 truncate">{n.subtitle}</p>
                          </button>
                          <button
                            onClick={(e) => handleDismiss(n, e)}
                            title="Dismiss"
                            className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors flex-shrink-0"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Footer note */}
            <div className="px-4 py-2 border-t border-slate-800">
              <p className="text-xs text-slate-600">
                Live from your current tasks &amp; projects. Dismissed on this browser only.
              </p>
            </div>
          </div>
        )}
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onChecklistUpdate={handleChecklistUpdate}
      />
    </>
  )
}
