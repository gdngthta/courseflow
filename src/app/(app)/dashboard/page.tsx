'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, ArrowRight, Mail } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { TaskCard } from '@/components/tasks/TaskCard'
import { RiskBadge } from '@/components/ui/Badge'
import { NoCriticalEmpty } from '@/components/ui/EmptyState'
import { OwlMascot } from '@/components/brand/OwlMascot'
import { InvitationCard } from '@/components/projects/InvitationCard'
import { useData } from '@/contexts/DataContext'
import { useAuthUser } from '@/contexts/AuthContext'
import { toAllTaskCards } from '@/lib/taskDerive'
import { toProjectCards } from '@/lib/projectDerive'
import { formatDueDate } from '@/lib/utils'
import type { TaskCardData } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const {
    userId, courses, personalTasks, projects, loading,
    receivedInvitations, acceptInvitation, declineInvitation,
  } = useData()
  const { user } = useAuthUser()

  /**
   * Dashboard task cards used to open a TaskDetailModal in-place here,
   * but that meant the user couldn't drill into a task's edit / mark-done
   * actions without an extra step. We now navigate to /tasks?task=<id>,
   * and the Tasks page auto-opens the drawer for that id on mount.
   */
  const openTaskInMyTasks = (task: TaskCardData) => {
    router.push(`/tasks?task=${encodeURIComponent(task.id)}`)
  }

  const allTasks = useMemo(
    () => toAllTaskCards(personalTasks, courses, projects, userId),
    [personalTasks, courses, projects, userId]
  )
  const allProjects = useMemo(() => toProjectCards(projects, userId, courses), [projects, userId, courses])
  const activeCourses = useMemo(() => courses.filter((c) => !c.is_archived), [courses])
  const activeProjects = useMemo(() => allProjects.filter((p) => p.status === 'active'), [allProjects])

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] || 'there'

  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const today = new Date().toISOString().split('T')[0]
  // ── Today Priority ────────────────────────────────────────────
  // Spec (Phase 5G #1): include every task that demands focus today,
  // not just ones due today/overdue:
  //   • overdue incomplete tasks
  //   • Critical-risk tasks (any due date)
  //   • due today
  //   • due tomorrow
  //   • due within 3 days AND progress < 50%
  //   • difficulty 4–5 AND due within 7 days
  // Deduplicate by task id since several rules can match.
  const inDays = (n: number) => {
    const d = new Date()
    d.setDate(d.getDate() + n)
    return d.toISOString().split('T')[0]
  }
  const tomorrowISO = inDays(1)
  const in3ISO = inDays(3)
  const in7ISO = inDays(7)

  const todayPriorityMap = new Map<string, TaskCardData>()
  for (const t of allTasks) {
    if (t.status === 'done') continue
    const isOverdue = t.due_date < today
    const isCritical = t.risk === 'critical'
    const isDueToday = t.due_date === today
    const isDueTomorrow = t.due_date === tomorrowISO
    const isClose3LowProgress = t.due_date <= in3ISO && t.progress < 50
    const isHardSoon = t.difficulty >= 4 && t.due_date <= in7ISO
    if (isOverdue || isCritical || isDueToday || isDueTomorrow || isClose3LowProgress || isHardSoon) {
      todayPriorityMap.set(t.id, t)
    }
  }
  const todayTasks = Array.from(todayPriorityMap.values()).sort((a, b) => {
    // Most urgent first: overdue → critical → nearest due_date
    const aOverdue = a.due_date < today ? 0 : 1
    const bOverdue = b.due_date < today ? 0 : 1
    if (aOverdue !== bOverdue) return aOverdue - bOverdue
    const aCrit = a.risk === 'critical' ? 0 : 1
    const bCrit = b.risk === 'critical' ? 0 : 1
    if (aCrit !== bCrit) return aCrit - bCrit
    return a.due_date.localeCompare(b.due_date)
  })

  const criticalTasks = allTasks.filter((t) => t.risk === 'critical' && t.status !== 'done')
  const upcomingTasks = allTasks
    .filter((t) => t.status !== 'done' && t.due_date > today)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 6)

  const summaryCards = [
    { label: "Today's Tasks", value: todayTasks.length, sub: `${todayTasks.filter((t) => t.risk === 'critical').length} critical` },
    { label: 'Critical Tasks', value: criticalTasks.length, sub: 'Need attention', accent: true },
    { label: 'Active Projects', value: activeProjects.length, sub: `${activeProjects.filter((p) => p.risk !== 'safe').length} need attention` },
    { label: 'Active Courses', value: activeCourses.length, sub: 'This semester' },
  ]

  // Group upcoming by date
  const upcomingByDate: Record<string, TaskCardData[]> = {}
  upcomingTasks.forEach((t) => {
    if (!upcomingByDate[t.due_date]) upcomingByDate[t.due_date] = []
    upcomingByDate[t.due_date].push(t)
  })

  if (loading) {
    return (
      <>
        <Topbar title="Dashboard" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-sm text-slate-500">Loading your dashboard…</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Topbar title="Dashboard" />
      <div className="p-4 sm:p-6 max-w-[1400px]">
        {/* Greeting */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl font-semibold text-white">
            {timeGreeting}, {firstName} 👋
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Here&apos;s what&apos;s happening with your coursework today.
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* ── Pending Invitations ── */}
        {receivedInvitations.length > 0 && (
          <div className="mb-8 bg-indigo-950/30 border border-indigo-800/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Mail size={15} className="text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">
                Pending Project Invitations
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-600 text-white font-medium">
                {receivedInvitations.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {receivedInvitations.map((inv) => (
                <InvitationCard
                  key={inv.id}
                  invitation={inv}
                  userCourses={activeCourses}
                  onAccept={acceptInvitation}
                  onDecline={declineInvitation}
                />
              ))}
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className={`bg-slate-900 border rounded-xl p-3 sm:p-4 ${card.accent ? 'border-red-500/30' : 'border-slate-800'}`}
            >
              <p className="text-xs text-slate-400 leading-tight">{card.label}</p>
              <p className={`text-2xl sm:text-3xl font-bold mt-1 ${card.accent && card.value > 0 ? 'text-red-400' : 'text-white'}`}>
                {card.value}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 leading-tight">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left col: Today's Priority + Critical Risk */}
          <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-6">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white inline-flex items-center gap-1.5">
                  Today&apos;s Priority
                  <span
                    title="Today's Priority is based on overdue tasks, critical risk, deadline proximity, progress, and difficulty."
                    className="text-slate-400 cursor-help text-xs"
                    aria-label="How Today's Priority is computed"
                  >
                    ⓘ
                  </span>
                </h3>
                <Link href="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                  View all <ArrowRight size={12} />
                </Link>
              </div>
              {todayTasks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {todayTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onClick={openTaskInMyTasks} />
                  ))}
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
                  <p className="text-sm text-slate-400">No tasks due today. 🎉</p>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Critical Risk</h3>
                <Link href="/tasks?tab=critical" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                  View all <ArrowRight size={12} />
                </Link>
              </div>
              {criticalTasks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {criticalTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onClick={openTaskInMyTasks} />
                  ))}
                </div>
              ) : (
                <NoCriticalEmpty />
              )}
            </section>
          </div>

          {/* Right col */}
          <div className="flex flex-col gap-6">
            {/* Upcoming Deadlines */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Upcoming Deadlines</h3>
                <Link href="/calendar" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Calendar
                </Link>
              </div>
              {Object.entries(upcomingByDate).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(upcomingByDate).map(([date, tasks]) => (
                    <div key={date}>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar size={11} className="text-slate-500" />
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-xs text-slate-600">— {formatDueDate(date)}</span>
                      </div>
                      <div className="space-y-1.5 pl-4 border-l border-slate-800">
                        {tasks.map((t) => (
                          <button key={t.id} onClick={() => openTaskInMyTasks(t)} className="w-full text-left">
                            <p className="text-xs text-slate-300 hover:text-white transition-colors truncate">{t.title}</p>
                            <p className="text-xs text-slate-500 truncate">{t.source_label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">No upcoming deadlines.</p>
              )}
            </section>

            {/* Owl tip card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
              <OwlMascot size={36} variant={criticalTasks.length > 0 ? 'thinking' : 'default'} className="flex-shrink-0 opacity-85" />
              <div>
                <p className="text-xs font-semibold text-slate-300">
                  {criticalTasks.length > 0
                    ? `${criticalTasks.length} critical task${criticalTasks.length !== 1 ? 's' : ''} need${criticalTasks.length === 1 ? 's' : ''} attention.`
                    : todayTasks.length > 0
                    ? "Clear today's tasks before they pile up."
                    : 'No urgent tasks right now. Keep up the pace.'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {criticalTasks.length > 0
                    ? 'Focus on these before new work comes in.'
                    : 'Your schedule is looking healthy.'}
                </p>
              </div>
            </div>

            {/* Course Overview */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Course Overview</h3>
                <Link href="/courses" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Manage
                </Link>
              </div>
              <div className="space-y-3">
                {activeCourses.map((course) => {
                  const courseTasks = allTasks.filter((t) => t.course_id === course.id && t.status !== 'done')
                  const hasRisk = courseTasks.some((t) => t.risk === 'critical')
                  return (
                    <div key={course.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: course.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{course.code}</p>
                        <p className="text-xs text-slate-400 truncate">{course.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{courseTasks.length} task{courseTasks.length !== 1 ? 's' : ''}</p>
                      </div>
                      <RiskBadge risk={hasRisk ? 'critical' : 'safe'} />
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

    </>
  )
}
