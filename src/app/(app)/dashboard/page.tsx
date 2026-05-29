'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Calendar, ArrowRight } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { RiskBadge } from '@/components/ui/Badge'
import { NoCriticalEmpty } from '@/components/ui/EmptyState'
import { OwlMascot } from '@/components/brand/OwlMascot'
import { useData } from '@/contexts/DataContext'
import { useAuthUser } from '@/contexts/AuthContext'
import { toAllTaskCards, buildMemberNameMap } from '@/lib/taskDerive'
import { toProjectCards } from '@/lib/projectDerive'
import { formatDueDate } from '@/lib/utils'
import type { TaskCardData, TaskChecklistItem } from '@/types'

export default function DashboardPage() {
  const { userId, courses, personalTasks, projects, loading, updatePersonalTaskChecklist, updateProjectTaskChecklist } = useData()
  const { user } = useAuthUser()
  const [selectedTask, setSelectedTask] = useState<TaskCardData | null>(null)

  const allTasks = useMemo(
    () => toAllTaskCards(personalTasks, courses, projects, userId),
    [personalTasks, courses, projects, userId]
  )
  const allProjects = useMemo(() => toProjectCards(projects, userId), [projects, userId])
  const memberNames = useMemo(() => buildMemberNameMap(projects), [projects])
  const activeCourses = useMemo(() => courses.filter((c) => !c.is_archived), [courses])
  const activeProjects = useMemo(() => allProjects.filter((p) => p.status === 'active'), [allProjects])

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] || 'there'

  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const today = new Date().toISOString().split('T')[0]
  const todayTasks = allTasks.filter((t) => t.status !== 'done' && t.due_date <= today)
  const criticalTasks = allTasks.filter((t) => t.risk === 'critical')
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

  const getAssigneeName = (task: TaskCardData) =>
    task.assigned_to ? (memberNames[task.assigned_to] ?? undefined) : undefined

  // Group upcoming by date
  const upcomingByDate: Record<string, TaskCardData[]> = {}
  upcomingTasks.forEach((t) => {
    if (!upcomingByDate[t.due_date]) upcomingByDate[t.due_date] = []
    upcomingByDate[t.due_date].push(t)
  })

  const handleChecklistUpdate = (taskId: string, checklist: TaskChecklistItem[]) => {
    const isPersonal = personalTasks.some((t) => t.id === taskId)
    if (isPersonal) updatePersonalTaskChecklist(taskId, checklist)
    else updateProjectTaskChecklist(taskId, checklist)
  }

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
      <div className="p-6 max-w-[1400px]">
        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {timeGreeting}, {firstName} 👋
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Here&apos;s what&apos;s happening with your coursework today.
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className={`bg-white dark:bg-slate-900 border rounded-xl p-4 ${card.accent ? 'border-red-500/30' : 'border-slate-200 dark:border-slate-800'}`}
            >
              <p className="text-xs text-slate-500 dark:text-slate-400">{card.label}</p>
              <p className={`text-3xl font-bold mt-1 ${card.accent && card.value > 0 ? 'text-red-400' : 'text-slate-900 dark:text-white'}`}>
                {card.value}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left col: Today's Priority + Critical Risk */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Today&apos;s Priority</h3>
                <Link href="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                  View all <ArrowRight size={12} />
                </Link>
              </div>
              {todayTasks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {todayTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onClick={setSelectedTask} />
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">No tasks due today. 🎉</p>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Critical Risk</h3>
                <Link href="/tasks?tab=critical" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                  View all <ArrowRight size={12} />
                </Link>
              </div>
              {criticalTasks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {criticalTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onClick={setSelectedTask} />
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
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Upcoming Deadlines</h3>
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
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-xs text-slate-600">— {formatDueDate(date)}</span>
                      </div>
                      <div className="space-y-1.5 pl-4 border-l border-slate-200 dark:border-slate-800">
                        {tasks.map((t) => (
                          <button key={t.id} onClick={() => setSelectedTask(t)} className="w-full text-left">
                            <p className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white transition-colors truncate">{t.title}</p>
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4">
              <OwlMascot size={36} variant={criticalTasks.length > 0 ? 'thinking' : 'default'} className="flex-shrink-0 opacity-85" />
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
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
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Course Overview</h3>
                <Link href="/courses" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Manage
                </Link>
              </div>
              <div className="space-y-3">
                {activeCourses.map((course) => {
                  const courseTasks = allTasks.filter((t) => t.course_id === course.id && t.status !== 'done')
                  const hasRisk = courseTasks.some((t) => t.risk === 'critical')
                  return (
                    <div key={course.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: course.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{course.code}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{course.name}</p>
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

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onChecklistUpdate={handleChecklistUpdate}
        assigneeName={selectedTask ? getAssigneeName(selectedTask) : undefined}
      />
    </>
  )
}
