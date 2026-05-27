'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { useData } from '@/contexts/DataContext'
import { toAllTaskCards, buildMemberNameMap } from '@/lib/taskDerive'
import { toProjectCards } from '@/lib/projectDerive'
import { formatFullDate } from '@/lib/utils'
import type { TaskCardData, TaskChecklistItem } from '@/types'

type FilterType = 'all' | 'personal' | 'group' | 'critical'

type CalendarItem =
  | { kind: 'task'; data: TaskCardData }
  | { kind: 'project'; id: string; name: string; courseCode: string; deadline: string }

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const FILTER_TABS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'personal', label: 'Personal' },
  { id: 'group', label: 'Group' },
  { id: 'critical', label: 'Critical' },
]

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay() // 0=Sun … 6=Sat
  return Array.from({ length: 42 }, (_, i) => new Date(year, month, 1 - startOffset + i))
}

function itemDotColor(item: CalendarItem): string {
  if (item.kind === 'project') return 'bg-emerald-400'
  if (item.data.risk === 'critical') return 'bg-red-400'
  return item.data.type === 'group' ? 'bg-violet-400' : 'bg-indigo-400'
}

function itemPillClass(item: CalendarItem): string {
  if (item.kind === 'project') return 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/60'
  if (item.data.risk === 'critical') return 'bg-red-900/40 text-red-300 border border-red-800/40 hover:bg-red-900/60'
  if (item.data.type === 'group') return 'bg-violet-900/40 text-violet-300 border border-violet-800/40 hover:bg-violet-900/60'
  return 'bg-indigo-900/40 text-indigo-300 border border-indigo-800/40 hover:bg-indigo-900/60'
}

export default function CalendarPage() {
  const router = useRouter()
  const { userId, courses, personalTasks, projects, updatePersonalTaskChecklist, updateProjectTaskChecklist } = useData()

  const now = new Date()
  const todayKey = toDateKey(now)

  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState<string>(todayKey)
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedTask, setSelectedTask] = useState<TaskCardData | null>(null)

  const allTasks = useMemo(
    () => toAllTaskCards(personalTasks, courses, projects, userId),
    [personalTasks, courses, projects, userId]
  )
  const allProjects = useMemo(() => toProjectCards(projects, userId), [projects, userId])
  const memberNames = useMemo(() => buildMemberNameMap(projects), [projects])

  const activeTasks = useMemo(() => allTasks.filter((t) => t.status !== 'done'), [allTasks])
  const activeProjects = useMemo(() => allProjects.filter((p) => p.status === 'active'), [allProjects])

  const filteredTasks = useMemo(() => {
    if (filter === 'personal') return activeTasks.filter((t) => t.type === 'personal')
    if (filter === 'group') return activeTasks.filter((t) => t.type === 'group')
    if (filter === 'critical') return activeTasks.filter((t) => t.risk === 'critical')
    return activeTasks
  }, [activeTasks, filter])

  // Build items-by-date map for the calendar grid
  const itemsByDate = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {}
    filteredTasks.forEach((task) => {
      if (!map[task.due_date]) map[task.due_date] = []
      map[task.due_date].push({ kind: 'task', data: task })
    })
    if (filter === 'all') {
      activeProjects.forEach((p) => {
        if (!map[p.deadline]) map[p.deadline] = []
        map[p.deadline].push({ kind: 'project', id: p.id, name: p.name, courseCode: p.course_code, deadline: p.deadline })
      })
    }
    return map
  }, [filteredTasks, activeProjects, filter])

  // 42 calendar cells
  const calendarDays = useMemo(() => getCalendarDays(year, month), [year, month])

  // Month navigation
  const goToPrev = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }
  const goToNext = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }
  const goToToday = () => {
    setYear(now.getFullYear())
    setMonth(now.getMonth())
    setSelectedDate(todayKey)
  }

  // Selected date groups
  const selectedItems = itemsByDate[selectedDate] ?? []
  const selPersonal = selectedItems.filter(
    (i): i is Extract<CalendarItem, { kind: 'task' }> => i.kind === 'task' && i.data.type === 'personal'
  )
  const selGroup = selectedItems.filter(
    (i): i is Extract<CalendarItem, { kind: 'task' }> => i.kind === 'task' && i.data.type === 'group'
  )
  const selProjects = selectedItems.filter(
    (i): i is Extract<CalendarItem, { kind: 'project' }> => i.kind === 'project'
  )

  // Upcoming deadlines (today onwards, up to 8 date groups)
  const upcomingGroups = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    filteredTasks.forEach((task) => {
      if (task.due_date >= todayKey) {
        if (!map.has(task.due_date)) map.set(task.due_date, [])
        map.get(task.due_date)!.push({ kind: 'task', data: task })
      }
    })
    if (filter === 'all') {
      activeProjects.forEach((p) => {
        if (p.deadline >= todayKey) {
          if (!map.has(p.deadline)) map.set(p.deadline, [])
          map.get(p.deadline)!.push({ kind: 'project', id: p.id, name: p.name, courseCode: p.course_code, deadline: p.deadline })
        }
      })
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 8)
      .map(([dateKey, items]) => ({ dateKey, items }))
  }, [filteredTasks, activeProjects, filter, todayKey])

  const handleChecklistUpdate = (taskId: string, checklist: TaskChecklistItem[]) => {
    const isPersonal = personalTasks.some((t) => t.id === taskId)
    if (isPersonal) updatePersonalTaskChecklist(taskId, checklist)
    else updateProjectTaskChecklist(taskId, checklist)
  }

  const getDateLabel = (dateKey: string) => {
    if (dateKey === todayKey) return 'Today'
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    if (dateKey === toDateKey(tomorrow)) return 'Tomorrow'
    return formatFullDate(dateKey)
  }

  return (
    <>
      <Topbar title="Calendar" />
      <div className="p-6">
        {/* Page header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">Calendar</h2>
          <p className="text-sm text-slate-400 mt-0.5">View your tasks and deadlines by date.</p>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6 items-start">

          {/* ── Calendar column ── */}
          <div className="flex-1 min-w-0">

            {/* Controls row */}
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
              {/* Month nav */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={goToPrev}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-base font-semibold text-white w-44 text-center select-none">
                  {MONTH_NAMES[month]} {year}
                </span>
                <button
                  onClick={goToNext}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={goToToday}
                  className="ml-1 px-2.5 py-1 text-xs font-medium text-indigo-400 border border-indigo-800/50 rounded-lg hover:bg-indigo-900/30 transition-colors"
                >
                  Today
                </button>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      filter === tab.id
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar grid */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              {/* Day-name header */}
              <div className="grid grid-cols-7 border-b border-slate-800">
                {DAY_NAMES.map((name) => (
                  <div key={name} className="py-2.5 text-center text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {name}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, idx) => {
                  const key = toDateKey(day)
                  const isThisMonth = day.getMonth() === month
                  const isToday = key === todayKey
                  const isSelected = key === selectedDate
                  const items = itemsByDate[key] ?? []
                  const visible = items.slice(0, 3)
                  const extra = items.length - 3

                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedDate(key)}
                      className={[
                        'min-h-[84px] p-2 cursor-pointer transition-colors',
                        idx % 7 !== 6 ? 'border-r border-slate-800' : '',
                        idx < 35 ? 'border-b border-slate-800' : '',
                        isSelected ? 'bg-slate-800/60' : 'hover:bg-slate-800/30',
                        !isThisMonth ? 'opacity-35' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      {/* Day number */}
                      <div className="flex justify-end mb-1">
                        <span
                          className={[
                            'w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full select-none',
                            isToday
                              ? 'bg-indigo-600 text-white'
                              : isThisMonth
                              ? 'text-slate-300'
                              : 'text-slate-600',
                          ].join(' ')}
                        >
                          {day.getDate()}
                        </span>
                      </div>

                      {/* Item pills */}
                      <div className="flex flex-col gap-0.5">
                        {visible.map((item, i) => (
                          <div
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (item.kind === 'task') setSelectedTask(item.data)
                              else router.push(`/projects/${item.id}`)
                            }}
                            className={`flex items-center gap-1 px-1 py-0.5 rounded text-[10px] font-medium truncate transition-colors ${itemPillClass(item)}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${itemDotColor(item)}`} />
                            <span className="truncate leading-tight">
                              {item.kind === 'task' ? item.data.title : item.name}
                            </span>
                          </div>
                        ))}
                        {extra > 0 && (
                          <span className="text-[10px] text-slate-500 pl-1 leading-tight">+{extra} more</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 mt-3 flex-wrap">
              {[
                { dot: 'bg-indigo-400', label: 'Personal task' },
                { dot: 'bg-violet-400', label: 'Group task' },
                { dot: 'bg-emerald-400', label: 'Project deadline' },
                { dot: 'bg-red-400', label: 'Critical' },
              ].map(({ dot, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="w-72 flex-shrink-0 flex flex-col gap-4">

            {/* Selected date details */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-sm font-semibold text-white mb-3">
                {formatFullDate(selectedDate)}
              </p>

              {selectedItems.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Nothing scheduled for this day.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {selPersonal.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 mb-1.5">
                        Personal Tasks
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {selPersonal.map((item) => (
                          <button
                            key={item.data.id}
                            onClick={() => setSelectedTask(item.data)}
                            className="flex items-start gap-2 text-left group w-full"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full mt-[3px] flex-shrink-0 ${item.data.risk === 'critical' ? 'bg-red-400' : 'bg-indigo-400'}`} />
                            <span className="text-xs text-slate-300 group-hover:text-white transition-colors leading-relaxed">
                              {item.data.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selGroup.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400 mb-1.5">
                        Group Tasks
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {selGroup.map((item) => (
                          <button
                            key={item.data.id}
                            onClick={() => setSelectedTask(item.data)}
                            className="flex items-start gap-2 text-left group w-full"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full mt-[3px] flex-shrink-0 ${item.data.risk === 'critical' ? 'bg-red-400' : 'bg-violet-400'}`} />
                            <span className="text-xs text-slate-300 group-hover:text-white transition-colors leading-relaxed">
                              {item.data.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selProjects.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 mb-1.5">
                        Project Deadlines
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {selProjects.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => router.push(`/projects/${item.id}`)}
                            className="flex items-start gap-2 text-left group w-full"
                          >
                            <span className="w-1.5 h-1.5 rounded-full mt-[3px] flex-shrink-0 bg-emerald-400" />
                            <div className="min-w-0">
                              <p className="text-xs text-slate-300 group-hover:text-white transition-colors leading-relaxed">
                                {item.name}
                              </p>
                              <p className="text-[10px] text-slate-500">{item.courseCode}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Upcoming deadlines */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-sm font-semibold text-white mb-3">Upcoming Deadlines</p>

              {upcomingGroups.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No upcoming deadlines.</p>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {upcomingGroups.map(({ dateKey, items }) => (
                    <div key={dateKey}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                        {getDateLabel(dateKey)}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {items.map((item, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              if (item.kind === 'task') setSelectedTask(item.data)
                              else router.push(`/projects/${item.id}`)
                            }}
                            className="flex items-start gap-2 cursor-pointer group"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full mt-[3px] flex-shrink-0 ${itemDotColor(item)}`} />
                            <div className="min-w-0">
                              <p className="text-xs text-slate-300 group-hover:text-white transition-colors leading-relaxed truncate">
                                {item.kind === 'task' ? item.data.title : item.name}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                {item.kind === 'project'
                                  ? item.courseCode
                                  : item.data.source_label}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onChecklistUpdate={handleChecklistUpdate}
        assigneeName={
          selectedTask?.assigned_to ? memberNames[selectedTask.assigned_to] : undefined
        }
      />
    </>
  )
}
