'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell, AlertTriangle, Clock, Calendar,
  UserPlus, Mail, ShieldCheck, UserMinus, CheckSquare, X,
} from 'lucide-react'
import { useData } from '@/contexts/DataContext'
import {
  deriveNotifications,
  loadDismissed,
  addDismissed,
  dismissAll as dismissAllStore,
  type AppNotification,
  type NotificationType,
} from '@/lib/notifications'
import { personalTaskToCard } from '@/lib/taskDerive'
import { toAssignedTaskCards } from '@/lib/projectDerive'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import type { TaskCardData, TaskChecklistItem, DBNotificationType } from '@/types'

// ── Derived (task-urgency) notification display ──────────────

const DERIVED_ICON: Record<NotificationType, React.ComponentType<{ size?: number; className?: string }>> = {
  overdue:          AlertTriangle,
  critical:         AlertTriangle,
  due_today:        Clock,
  due_tomorrow:     Clock,
  project_deadline: Calendar,
  member_added:     UserPlus,
}

const DERIVED_COLOR: Record<NotificationType, string> = {
  overdue:          'text-red-400',
  critical:         'text-red-400',
  due_today:        'text-amber-400',
  due_tomorrow:     'text-amber-400',
  project_deadline: 'text-emerald-400',
  member_added:     'text-indigo-400',
}

const DERIVED_LABEL: Record<NotificationType, string> = {
  overdue:          'Overdue',
  critical:         'Critical',
  due_today:        'Due today',
  due_tomorrow:     'Due tomorrow',
  project_deadline: 'Project deadline',
  member_added:     'Added to project',
}

// ── DB notification display ──────────────────────────────────

const DB_ICON: Record<DBNotificationType, React.ComponentType<{ size?: number; className?: string }>> = {
  project_invitation_received: Mail,
  project_invitation_accepted: UserPlus,
  project_invitation_declined: UserMinus,
  project_role_changed:        ShieldCheck,
  project_member_removed:      UserMinus,
  project_member_left:         UserMinus,
  project_task_assigned:       CheckSquare,
  deadline_warning:            Clock,
  high_risk_task:              AlertTriangle,
}

const DB_COLOR: Record<DBNotificationType, string> = {
  project_invitation_received: 'text-indigo-400',
  project_invitation_accepted: 'text-emerald-400',
  project_invitation_declined: 'text-slate-400',
  project_role_changed:        'text-indigo-400',
  project_member_removed:      'text-red-400',
  project_member_left:         'text-slate-400',
  project_task_assigned:       'text-indigo-400',
  deadline_warning:            'text-amber-400',
  high_risk_task:              'text-red-400',
}

export function NotificationsPanel() {
  const router = useRouter()
  const {
    userId, courses, personalTasks, projects,
    dbNotifications, receivedInvitations,
    updatePersonalTaskChecklist, updateProjectTaskChecklist,
    markNotificationRead, markAllNotificationsRead,
  } = useData()
  const [open, setOpen] = useState(false)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [selectedTask, setSelectedTask] = useState<TaskCardData | null>(null)
  const [clickError, setClickError] = useState('')
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setDismissedIds(new Set(loadDismissed().map((e) => e.id)))
    if (open) setClickError('')
  }, [open])

  // ── Derived task-urgency notifications ──
  const allDerived = useMemo(
    () => deriveNotifications({ userId, courses, personalTasks, projects }),
    [userId, courses, personalTasks, projects]
  )
  const visibleDerived = useMemo(
    () => allDerived.filter((n) => !dismissedIds.has(n.id)),
    [allDerived, dismissedIds]
  )

  // ── DB notifications (unread) ──
  const unreadDB = useMemo(
    () => dbNotifications.filter((n) => !n.read_at),
    [dbNotifications]
  )

  // ── Pending invitations count ──
  const pendingInviteCount = receivedInvitations.length

  // Total badge = pending invites + unread DB + undismissed derived
  const unread = pendingInviteCount + unreadDB.length + visibleDerived.length

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

  const handleDismissDerived = useCallback((n: AppNotification, e: React.MouseEvent) => {
    e.stopPropagation()
    addDismissed(n)
    setDismissedIds((prev) => new Set(prev).add(n.id))
  }, [])

  const handleDismissAllDerived = useCallback(() => {
    dismissAllStore(visibleDerived)
    setDismissedIds((prev) => {
      const next = new Set(prev)
      visibleDerived.forEach((n) => next.add(n.id))
      return next
    })
  }, [visibleDerived])

  const handleMarkAllRead = useCallback(async () => {
    await markAllNotificationsRead()
    handleDismissAllDerived()
  }, [markAllNotificationsRead, handleDismissAllDerived])

  const handleClickDerived = useCallback(
    (n: AppNotification) => {
      setClickError('')

      if (n.entity === 'project') {
        const exists = projects.some((p) => p.project.id === n.entityId)
        if (!exists) { setClickError('This project no longer exists.'); return }
        router.push(n.href)
        setOpen(false)
        return
      }

      if (n.entity === 'personal_task') {
        const t = personalTasks.find((pt) => pt.id === n.entityId)
        if (!t) { setClickError('This task no longer exists.'); return }
        setSelectedTask(personalTaskToCard(t, courses))
        setOpen(false)
        return
      }

      if (n.entity === 'project_task') {
        const card = toAssignedTaskCards(projects, userId).find((c) => c.id === n.entityId)
        if (!card) { setClickError('This task no longer exists.'); return }
        setSelectedTask(card)
        setOpen(false)
        return
      }
    },
    [router, projects, personalTasks, courses, userId]
  )

  const handleClickDB = useCallback(
    async (notifId: string, entityType?: string, entityId?: string) => {
      setClickError('')
      await markNotificationRead(notifId)

      if (entityType === 'project_invitation') {
        // Navigate to Projects page where the user can see the invitation inbox
        router.push('/projects')
        setOpen(false)
        return
      }

      if (entityType === 'project' && entityId) {
        router.push(`/projects/${entityId}`)
        setOpen(false)
        return
      }

      if (entityType === 'project_task' && entityId) {
        const card = toAssignedTaskCards(projects, userId).find((c) => c.id === entityId)
        if (card) {
          setSelectedTask(card)
          setOpen(false)
        } else {
          setClickError('This task no longer exists or is no longer assigned to you.')
        }
        return
      }
    },
    [markNotificationRead, router, projects, userId]
  )

  const handleChecklistUpdate = (taskId: string, checklist: TaskChecklistItem[]) => {
    const isPersonal = personalTasks.some((t) => t.id === taskId)
    if (isPersonal) updatePersonalTaskChecklist(taskId, checklist)
    else updateProjectTaskChecklist(taskId, checklist)
  }

  const hasAnything = unread > 0

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
          <div className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] sm:w-[22rem] max-h-[80vh] sm:max-h-[32rem] bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <p className="text-sm font-semibold text-white">
                Notifications {hasAnything && <span className="text-slate-500">({unread})</span>}
              </p>
              {hasAnything && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Click error */}
            {clickError && (
              <div className="px-4 py-2 border-b border-red-800/50 bg-red-900/20">
                <p className="text-xs text-red-400">{clickError}</p>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {!hasAnything ? (
                <p className="px-4 py-8 text-xs text-slate-500 text-center">
                  No urgent notifications right now.
                </p>
              ) : (
                <ul>
                  {/* ── Pending invitations (action required) ── */}
                  {pendingInviteCount > 0 && (
                    <li
                      className="border-b border-slate-800 hover:bg-slate-800/60 transition-colors cursor-pointer"
                      onClick={() => { router.push('/projects'); setOpen(false) }}
                    >
                      <div className="flex items-start gap-3 px-4 py-3">
                        <Mail size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-indigo-400 mb-0.5">Action required</p>
                          <p className="text-sm text-slate-200">
                            {pendingInviteCount} pending project invitation{pendingInviteCount !== 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-slate-500">Go to Projects to accept or decline</p>
                        </div>
                      </div>
                    </li>
                  )}

                  {/* ── DB event notifications (unread) ── */}
                  {unreadDB.map((n) => {
                    const Icon = DB_ICON[n.type] ?? Bell
                    const color = DB_COLOR[n.type] ?? 'text-slate-400'
                    return (
                      <li
                        key={n.id}
                        className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800/60 transition-colors"
                      >
                        <div className="flex items-start gap-3 px-4 py-3">
                          <Icon size={14} className={`${color} flex-shrink-0 mt-0.5`} />
                          <button
                            onClick={() => handleClickDB(n.id, n.entity_type, n.entity_id)}
                            className="flex-1 text-left min-w-0"
                          >
                            <p className="text-xs text-slate-500 mb-0.5">{n.title}</p>
                            <p className="text-sm text-slate-200 line-clamp-2">{n.message}</p>
                          </button>
                          <button
                            onClick={() => markNotificationRead(n.id)}
                            title="Mark as read"
                            className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors flex-shrink-0"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </li>
                    )
                  })}

                  {/* ── Derived task-urgency notifications ── */}
                  {visibleDerived.map((n) => {
                    const Icon = DERIVED_ICON[n.type]
                    return (
                      <li
                        key={n.id}
                        className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800/60 transition-colors"
                      >
                        <div className="flex items-start gap-3 px-4 py-3">
                          <Icon size={14} className={`${DERIVED_COLOR[n.type]} flex-shrink-0 mt-0.5`} />
                          <button
                            onClick={() => handleClickDerived(n)}
                            className="flex-1 text-left min-w-0"
                          >
                            <p className="text-xs text-slate-500 mb-0.5">{DERIVED_LABEL[n.type]}</p>
                            <p className="text-sm text-slate-200 truncate">{n.title}</p>
                            <p className="text-xs text-slate-500 truncate">{n.subtitle}</p>
                          </button>
                          <button
                            onClick={(e) => handleDismissDerived(n, e)}
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

            {/* Footer */}
            <div className="px-4 py-2 border-t border-slate-800">
              <p className="text-xs text-slate-600">
                Task alerts derived live · Events from Supabase · Dismissed on this browser only.
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
