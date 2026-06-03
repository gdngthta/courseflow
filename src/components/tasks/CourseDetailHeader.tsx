'use client'

import { CheckCircle2, Circle, FolderOpen } from 'lucide-react'
import type { CourseStats } from '@/lib/courseDerive'
import type { ProjectWithRelations } from '@/lib/api/projects'

interface Props {
  stats: CourseStats
  /** All projects the user has access to — we filter to this course. */
  projects: ProjectWithRelations[]
}

/** Format an ISO date string as "MMM D" (e.g. "Jun 15"). */
function formatShortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function CourseDetailHeader({ stats, projects }: Props) {
  const courseProjects = projects.filter(
    (pd) => pd.project.course_id === stats.id && pd.project.status === 'active'
  )

  return (
    <div className="mb-5 rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
      {/* Color accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: stats.color }} />

      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Course identity */}
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-md"
                style={{ backgroundColor: stats.color + '33', color: stats.color }}
              >
                {stats.code}
              </span>
              {stats.is_shared && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-violet-900/40 text-violet-400 border border-violet-700/50">
                  Shared
                </span>
              )}
              {stats.is_archived && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-700 text-slate-400">
                  Archived
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-white">{stats.name}</h3>
          </div>

          {/* Stat pills */}
          <div className="flex items-center gap-3 flex-wrap">
            <StatPill
              icon={<Circle size={13} className="text-slate-400" />}
              label="Incomplete"
              value={stats.incomplete_tasks}
              highlight={stats.incomplete_tasks > 0}
            />
            <StatPill
              icon={<CheckCircle2 size={13} className="text-emerald-400" />}
              label="Done"
              value={stats.completed_tasks}
            />
            <StatPill
              icon={<FolderOpen size={13} className="text-indigo-400" />}
              label="Active projects"
              value={courseProjects.length}
            />
            {stats.nearest_due_date && (
              <div className="text-xs text-amber-400/90 bg-amber-950/30 border border-amber-800/40 px-2.5 py-1.5 rounded-lg">
                Nearest due: <strong>{formatShortDate(stats.nearest_due_date)}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Related active projects */}
        {courseProjects.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700/60">
            <p className="text-[11px] font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
              Related projects
            </p>
            <div className="flex flex-wrap gap-1.5">
              {courseProjects.map(({ project }) => (
                <span
                  key={project.id}
                  className="text-xs px-2.5 py-1 rounded-full bg-slate-700 text-slate-300 border border-slate-600"
                >
                  {project.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatPill({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700/60">
      {icon}
      <span className={`text-sm font-semibold ${highlight ? 'text-white' : 'text-slate-300'}`}>
        {value}
      </span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}
