export type TaskType = 'personal' | 'group'
export type TaskStatus = 'not_started' | 'in_progress' | 'done'
export type RiskStatus = 'safe' | 'warning' | 'critical' | 'completed'
export type ProjectRole = 'leader' | 'admin' | 'member'
export type ProjectStatus = 'active' | 'completed'
export type Difficulty = 1 | 2 | 3 | 4 | 5

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

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  avatar_url?: string
}

// Normalised view types used by UI components

export interface TaskLink {
  label: string
  url: string
}

export interface TaskChecklistItem {
  id: string
  text: string
  done: boolean
}

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
}
