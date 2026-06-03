export type TaskType = 'personal' | 'group'
export type TaskStatus = 'not_started' | 'in_progress' | 'review' | 'done'
export type RiskStatus = 'safe' | 'warning' | 'critical' | 'completed'
export type ProjectRole = 'leader' | 'admin' | 'member'
export type ProjectStatus = 'active' | 'completed'
export type Difficulty = 1 | 2 | 3 | 4 | 5

// ── Reusable sub-types (defined early so task entities can reference them) ──

export interface TaskLink {
  label: string
  url: string
}

export interface TaskChecklistItem {
  id: string
  text: string
  done: boolean
}

// ── Core entities ──

export interface Course {
  id: string
  user_id: string
  code: string
  name: string
  lecturer?: string
  semester?: string
  color: string
  is_archived: boolean
  created_at: string
}

export interface PersonalTask {
  id: string
  user_id: string
  course_id?: string
  title: string
  type: 'personal'
  status: TaskStatus
  difficulty: Difficulty
  progress: number
  due_date: string
  notes?: string
  links?: TaskLink[]
  checklist?: TaskChecklistItem[]
  created_at: string
}

export interface ProjectTask {
  id: string
  project_id: string
  title: string
  type: 'group'
  status: TaskStatus
  difficulty: Difficulty
  progress: number
  due_date: string
  assigned_to?: string
  notes?: string
  links?: TaskLink[]
  checklist?: TaskChecklistItem[]
  created_at: string
}

export interface Project {
  id: string
  name: string
  course_id: string
  description?: string
  deadline: string
  status: ProjectStatus
  completed_at?: string
  created_by: string
  created_at: string
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: ProjectRole
  joined_at: string
}

export interface ProjectLink {
  id: string
  project_id: string
  label: string
  url: string
}

// ── Normalised view types used by UI components ──

export interface TaskCardData {
  id: string
  title: string
  type: TaskType
  status: TaskStatus
  risk: RiskStatus
  difficulty: Difficulty
  progress: number
  due_date: string
  source_label: string
  project_id?: string
  course_id?: string
  notes?: string
  links?: TaskLink[]
  checklist?: TaskChecklistItem[]
  assigned_to?: string
}

// ── Telegram reminders ──

export type ReminderType = 'around_deadline' | 'high_risk'
export type ReminderDaysBefore = 0 | 1 | 3 | 7

export interface ReminderPreferences {
  id: string
  user_id: string
  enabled: boolean
  around_deadline_enabled: boolean
  high_risk_enabled: boolean
  days_before: ReminderDaysBefore
  send_time: string
  created_at: string
  updated_at: string
}

export interface ReminderLog {
  id: string
  user_id: string
  task_type: 'personal' | 'project'
  task_id: string
  reminder_type: ReminderType
  sent_to: string
  sent_date: string
  sent_at: string
  status: 'sent' | 'failed'
  error_message?: string
}

export interface ProjectCardData {
  id: string
  name: string
  course_code: string
  course_name: string
  deadline: string
  member_count: number
  user_role: ProjectRole
  progress: number
  risk: RiskStatus
  status: ProjectStatus
  completed_at?: string
  /** Total project tasks (all members). */
  total_tasks: number
  /** Tasks where status='done'. */
  completed_tasks: number
  /** Tasks where status!='done'. Equals total_tasks - completed_tasks. */
  incomplete_tasks: number
  /** Incomplete project tasks assigned to the current viewer. */
  assigned_to_me: number
  /** ISO date of the nearest incomplete task due date, or null if no tasks. */
  nearest_task_due: string | null
}
