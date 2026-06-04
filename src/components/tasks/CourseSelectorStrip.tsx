'use client'

import { BookOpen, FolderOpen, Archive } from 'lucide-react'
import type { CourseStats } from '@/lib/courseDerive'

interface AllCoursesStats {
  total_tasks: number
  incomplete_tasks: number
}

interface Props {
  courseStats: CourseStats[]
  selectedCourseId: string | null
  onSelect: (courseId: string | null) => void
  showArchived: boolean
  onToggleArchived: () => void
  allStats: AllCoursesStats
}

/** Format an ISO date string as "MMM D" (e.g. "Jun 15"). */
function formatShortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function CourseSelectorStrip({
  courseStats,
  selectedCourseId,
  onSelect,
  showArchived,
  onToggleArchived,
  allStats,
}: Props) {
  const active = courseStats.filter((c) => !c.is_archived && !c.is_shared)
  const archived = courseStats.filter((c) => c.is_archived)
  const shared = courseStats.filter((c) => c.is_shared)

  return (
    <div className="mb-6">
      {/* Scrollable card row — all cards are same size, scroll on overflow */}
      <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none">

        {/* All Courses card */}
        <CourseCard
          id={null}
          label="All Courses"
          sublabel={null}
          color="#6366f1"
          totalTasks={allStats.total_tasks}
          incompleteTasks={allStats.incomplete_tasks}
          activeProjects={null}
          nearestDue={null}
          isSelected={selectedCourseId === null}
          isShared={false}
          isArchived={false}
          onClick={() => onSelect(null)}
        />

        {/* Active courses */}
        {active.map((c) => (
          <CourseCard
            key={c.id}
            id={c.id}
            label={c.code}
            sublabel={c.name}
            color={c.color}
            totalTasks={c.total_tasks}
            incompleteTasks={c.incomplete_tasks}
            activeProjects={c.active_projects}
            nearestDue={c.nearest_due_date}
            isSelected={selectedCourseId === c.id}
            isShared={false}
            isArchived={false}
            onClick={() => onSelect(c.id)}
          />
        ))}

        {/* Shared courses from other users' projects */}
        {shared.map((c) => (
          <CourseCard
            key={c.id}
            id={c.id}
            label={c.code}
            sublabel={c.name}
            color={c.color}
            totalTasks={c.total_tasks}
            incompleteTasks={c.incomplete_tasks}
            activeProjects={c.active_projects}
            nearestDue={c.nearest_due_date}
            isSelected={selectedCourseId === c.id}
            isShared={true}
            isArchived={false}
            onClick={() => onSelect(c.id)}
          />
        ))}

        {/* Archived courses (shown only when toggled) */}
        {showArchived &&
          archived.map((c) => (
            <CourseCard
              key={c.id}
              id={c.id}
              label={c.code}
              sublabel={c.name}
              color={c.color}
              totalTasks={c.total_tasks}
              incompleteTasks={c.incomplete_tasks}
              activeProjects={c.active_projects}
              nearestDue={c.nearest_due_date}
              isSelected={selectedCourseId === c.id}
              isShared={false}
              isArchived={true}
              onClick={() => onSelect(c.id)}
            />
          ))}

        {/* Show/hide archived toggle — sits at the end of the row, vertically centred */}
        <div className="flex-shrink-0 flex items-center">
          <button
            onClick={onToggleArchived}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
              showArchived
                ? 'bg-slate-700 border-slate-600 text-slate-200'
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            <Archive size={12} />
            {showArchived ? 'Hide archived' : 'Show archived'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Individual course card ──────────────────────────────────
//
// Fixed width (240px) and fixed height (128px) so every card in
// the strip is the same size regardless of content length.
// Long text is truncated with ellipsis rather than reflowing.

interface CourseCardProps {
  id: string | null
  label: string
  sublabel: string | null
  color: string
  totalTasks: number
  incompleteTasks: number
  activeProjects: number | null
  nearestDue: string | null
  isSelected: boolean
  isShared: boolean
  isArchived: boolean
  onClick: () => void
}

function CourseCard({
  label,
  sublabel,
  color,
  totalTasks,
  incompleteTasks,
  activeProjects,
  nearestDue,
  isSelected,
  isShared,
  isArchived,
  onClick,
}: CourseCardProps) {
  return (
    <button
      onClick={onClick}
      style={{ width: 240, height: 128 }}
      className={`flex-shrink-0 text-left rounded-xl border transition-all overflow-hidden flex flex-col ${
        isSelected
          ? 'border-indigo-500 bg-indigo-950/60 ring-1 ring-indigo-500/40'
          : 'border-slate-700 bg-slate-800/60 hover:border-slate-600 hover:bg-slate-800'
      } ${isArchived ? 'opacity-60' : ''}`}
    >
      {/* Colour accent bar — always 4px, full width */}
      <div className="h-1 w-full flex-shrink-0" style={{ backgroundColor: color }} />

      {/* Card body — fixed remaining height, no reflow */}
      <div className="flex-1 px-3 pt-2.5 pb-2.5 flex flex-col justify-between overflow-hidden">

        {/* Top row: code/label + badges */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {sublabel ? (
              <BookOpen size={11} className="text-slate-400 flex-shrink-0 mt-0.5" />
            ) : (
              <FolderOpen size={11} className="text-slate-400 flex-shrink-0 mt-0.5" />
            )}
            <span
              className={`text-xs font-semibold truncate ${
                isSelected ? 'text-indigo-300' : 'text-slate-200'
              }`}
            >
              {label}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isShared && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-violet-900/50 text-violet-400 border border-violet-700/50 leading-none whitespace-nowrap">
                Shared
              </span>
            )}
            {isArchived && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-slate-700 text-slate-400 border border-slate-600 leading-none whitespace-nowrap">
                Archived
              </span>
            )}
          </div>
        </div>

        {/* Course name (one line, truncated) */}
        <p className="text-[11px] text-slate-400 truncate leading-tight mt-1">
          {sublabel ?? ' '}{/* non-breaking space keeps height if no sublabel */}
        </p>

        {/* Stats row — always rendered, fixed bottom */}
        <div className="mt-auto pt-1.5 space-y-0.5">
          <p className="text-[11px] text-slate-400 truncate">
            <span className="text-slate-200 font-medium">{incompleteTasks}</span>
            {' '}incomplete
            {totalTasks > 0 && (
              <span className="text-slate-500"> / {totalTasks} total</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            {activeProjects !== null && activeProjects > 0 && (
              <p className="text-[11px] text-slate-500 truncate">
                {activeProjects} project{activeProjects !== 1 ? 's' : ''}
              </p>
            )}
            {nearestDue && (
              <p className="text-[11px] text-amber-400/80 truncate ml-auto">
                Due {formatShortDate(nearestDue)}
              </p>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
