'use client'

import { AlertTriangle, CalendarClock, CalendarDays } from 'lucide-react'
import type { DeadlineSummary } from '@/lib/courseDerive'

interface Props {
  summary: DeadlineSummary
}

/**
 * Compact row of deadline-bucket badges shown above the task list.
 * Only renders when at least one bucket is non-zero.
 */
export function UpcomingDeadlineSummary({ summary }: Props) {
  const { dueToday, dueTomorrow, dueThisWeek, critical } = summary
  if (!dueToday && !dueTomorrow && !dueThisWeek && !critical) return null

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
        Upcoming:
      </span>

      {dueToday > 0 && (
        <Badge
          icon={<CalendarClock size={11} />}
          label={`${dueToday} due today`}
          colorCls="bg-red-950/40 text-red-400 border-red-800/50"
        />
      )}
      {dueTomorrow > 0 && (
        <Badge
          icon={<CalendarDays size={11} />}
          label={`${dueTomorrow} due tomorrow`}
          colorCls="bg-orange-950/40 text-orange-400 border-orange-800/50"
        />
      )}
      {dueThisWeek > 0 && (
        <Badge
          icon={<CalendarDays size={11} />}
          label={`${dueThisWeek} this week`}
          colorCls="bg-amber-950/40 text-amber-400 border-amber-800/50"
        />
      )}
      {critical > 0 && (
        <Badge
          icon={<AlertTriangle size={11} />}
          label={`${critical} critical`}
          colorCls="bg-rose-950/40 text-rose-400 border-rose-800/50"
        />
      )}
    </div>
  )
}

function Badge({
  icon,
  label,
  colorCls,
}: {
  icon: React.ReactNode
  label: string
  colorCls: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${colorCls}`}
    >
      {icon}
      {label}
    </span>
  )
}
