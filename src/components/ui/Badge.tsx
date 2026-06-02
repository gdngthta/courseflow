import type { RiskStatus, TaskStatus, TaskType, ProjectRole } from '@/types'

// --- Risk Badge ---

const riskStyles: Record<RiskStatus, string> = {
  critical: 'bg-red-500/15 text-red-400 border border-red-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  safe: 'bg-green-500/15 text-green-400 border border-green-500/30',
  completed: 'bg-slate-500/15 text-slate-500 dark:text-slate-400 border border-slate-500/30',
}

const riskLabels: Record<RiskStatus, string> = {
  critical: 'Critical',
  warning: 'Warning',
  safe: 'Safe',
  completed: 'Completed',
}

export function RiskBadge({ risk }: { risk: RiskStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${riskStyles[risk]}`}>
      {riskLabels[risk]}
    </span>
  )
}

// --- Status Badge ---

const statusStyles: Record<TaskStatus, string> = {
  not_started: 'bg-slate-500/15 text-slate-500 dark:text-slate-400 border border-slate-500/30',
  in_progress: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  review: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  done: 'bg-green-500/15 text-green-400 border border-green-500/30',
}

const statusLabels: Record<TaskStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  )
}

// --- Task Type Badge ---

const typeStyles: Record<TaskType, string> = {
  personal: 'bg-violet-500/15 text-violet-400 border border-violet-500/30',
  group: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
}

const typeLabels: Record<TaskType, string> = {
  personal: 'Personal',
  group: 'Group',
}

export function TypeBadge({ type }: { type: TaskType }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${typeStyles[type]}`}>
      {typeLabels[type]}
    </span>
  )
}

// --- Role Badge ---

const roleStyles: Record<ProjectRole, string> = {
  leader: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  admin: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  member: 'bg-slate-500/15 text-slate-500 dark:text-slate-400 border border-slate-500/30',
}

// Phase 5G: display labels reflect intent (who can do what) instead of
// raw DB values. The DB still stores leader/admin/member because the
// SECURITY DEFINER RLS helpers (is_project_manager etc.) depend on
// those exact strings.
const roleLabels: Record<ProjectRole, string> = {
  leader: 'Leader',
  admin: 'Editor',
  member: 'Viewer',
}

export function RoleBadge({ role }: { role: ProjectRole }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${roleStyles[role]}`}>
      {roleLabels[role]}
    </span>
  )
}
