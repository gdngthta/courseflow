// Mock data — used throughout the app until Supabase is connected (Phase 2+)
// All dates are relative to 2026-05-24 (current date during development)
// Phase 1: Static UI only — no real backend, no auth, no database.

import type { Course, PersonalTask, ProjectTask, Project, ProjectMember, ProjectLink, User, TaskCardData, ProjectCardData, TaskLink, TaskChecklistItem } from '@/types'
import { calculateRisk, calculateProjectRisk } from '@/lib/risk'

export const MOCK_USER: User = {
  id: 'user-1',
  email: 'gadingtahta09@gmail.com',
  first_name: 'Gading',
  last_name: 'Student',
}

// Other project members (display names for UI)
export const MOCK_MEMBERS: Record<string, { name: string; email: string }> = {
  'user-1': { name: 'Gading (You)', email: 'gadingtahta09@gmail.com' },
  'user-2': { name: 'Sarah Chen', email: 'sarah@university.edu' },
  'user-3': { name: 'Ahmad Razif', email: 'ahmad@university.edu' },
  'user-4': { name: 'Lim Wei', email: 'limwei@university.edu' },
}

export const MOCK_COURSES: Course[] = [
  { id: 'c1', user_id: 'user-1', code: 'WIA2005', name: 'Algorithm Design', color: '#6366f1', is_archived: false, created_at: '2026-01-01' },
  { id: 'c2', user_id: 'user-1', code: 'WIA2001', name: 'Software Engineering', color: '#22c55e', is_archived: false, created_at: '2026-01-01' },
  { id: 'c3', user_id: 'user-1', code: 'WIA1005', name: 'Network Technology', color: '#f59e0b', is_archived: false, created_at: '2026-01-01' },
  { id: 'c4', user_id: 'user-1', code: 'HCI', name: 'Human Computer Interaction', color: '#ec4899', is_archived: false, created_at: '2026-01-01' },
  // Archived course — kept for history, hidden from active planning views
  { id: 'c5', user_id: 'user-1', code: 'WIA1001', name: 'Introduction to Computing', color: '#64748b', is_archived: true, created_at: '2025-07-01' },
]

export const MOCK_PERSONAL_TASKS: PersonalTask[] = [
  {
    id: 'pt1', user_id: 'user-1', course_id: 'c3',
    title: 'Read Chapter 4 & 5', type: 'personal',
    status: 'in_progress', difficulty: 2, progress: 20,
    due_date: '2026-05-24',
    notes: 'Review Chapter 4 (Subnetting) and Chapter 5 (IPv6). Focus on CIDR notation and IPv6 address formatting. There will be a short exercise at the tutorial session — come prepared with examples.',
    created_at: '2026-05-20',
  },
  {
    id: 'pt2', user_id: 'user-1', course_id: 'c3',
    title: 'Submit Lab 3', type: 'personal',
    status: 'in_progress', difficulty: 3, progress: 60,
    due_date: '2026-05-26',
    notes: 'Configure a simple LAN topology in Packet Tracer with at least 3 routers. Include screenshots, all configuration commands, and a brief analysis in the report. Submit both the .pkt file and PDF report via the student portal.',
    created_at: '2026-05-18',
  },
  {
    id: 'pt3', user_id: 'user-1', course_id: 'c4',
    title: 'Study for Midterm', type: 'personal',
    status: 'not_started', difficulty: 4, progress: 0,
    due_date: '2026-05-30',
    notes: "Midterm covers Weeks 1–7. Key topics: Nielsen's 10 usability heuristics, user research methods (interviews, surveys, observation), wireframing principles, and accessibility guidelines (WCAG 2.1). Past year paper is available on the e-learning portal.",
    created_at: '2026-05-19',
  },
  {
    id: 'pt4', user_id: 'user-1', course_id: 'c2',
    title: 'Draft Wireframes', type: 'personal',
    status: 'not_started', difficulty: 3, progress: 0,
    due_date: '2026-05-28',
    notes: 'Create low-fidelity wireframes for 3 core screens: Login, Dashboard, and Task Management. Use Figma. Follow the SE project brief — include navigation flow arrows and annotate key UI interactions. Submit as a shared Figma link.',
    created_at: '2026-05-20',
  },
]

export const MOCK_PROJECTS: Project[] = [
  { id: 'proj1', name: 'WIA2005 Group Project', course_id: 'c1', deadline: '2026-05-30', status: 'active', created_by: 'user-1', created_at: '2026-04-01' },
  { id: 'proj2', name: 'Research Paper', course_id: 'c2', deadline: '2026-06-15', status: 'active', created_by: 'user-2', created_at: '2026-04-10' },
  // Completed project — shown in Completed / History tab, read-only
  { id: 'proj3', name: 'Final Presentation', course_id: 'c1', deadline: '2026-05-25', status: 'completed', completed_at: '2026-05-22', created_by: 'user-3', created_at: '2026-04-15' },
]

export const MOCK_PROJECT_MEMBERS: ProjectMember[] = [
  { id: 'pm1', project_id: 'proj1', user_id: 'user-1', role: 'leader', joined_at: '2026-04-01' },
  { id: 'pm2', project_id: 'proj1', user_id: 'user-2', role: 'member', joined_at: '2026-04-01' },
  { id: 'pm3', project_id: 'proj1', user_id: 'user-3', role: 'member', joined_at: '2026-04-01' },
  { id: 'pm4', project_id: 'proj1', user_id: 'user-4', role: 'admin', joined_at: '2026-04-02' },
  { id: 'pm5', project_id: 'proj2', user_id: 'user-1', role: 'member', joined_at: '2026-04-10' },
  { id: 'pm6', project_id: 'proj3', user_id: 'user-1', role: 'admin', joined_at: '2026-04-15' },
]

export const MOCK_PROJECT_TASKS: ProjectTask[] = [
  {
    id: 'pjt1', project_id: 'proj1', title: 'Create pseudocode slide',
    type: 'group', status: 'in_progress', difficulty: 3, progress: 80,
    due_date: '2026-05-24', assigned_to: 'user-1',
    notes: "Design the pseudocode slide for our Dijkstra's algorithm implementation. Include: problem statement, input/output specification, step-by-step pseudocode, and time complexity analysis. Keep it concise — maximum 2 slides. Coordinate with the implementation team before finalising.",
    created_at: '2026-04-05',
  },
  {
    id: 'pjt2', project_id: 'proj1', title: 'Finalize database schema',
    type: 'group', status: 'not_started', difficulty: 4, progress: 10,
    due_date: '2026-05-24', assigned_to: 'user-1',
    notes: 'Review the current data model and produce the final schema diagram. Must include all entities, attributes, primary keys, foreign keys, and cardinality. Use snake_case naming convention throughout. Cross-check with the API design document before submitting for leader review.',
    created_at: '2026-04-05',
  },
  {
    id: 'pjt3', project_id: 'proj1', title: 'Write introduction section',
    type: 'group', status: 'done', difficulty: 2, progress: 100,
    due_date: '2026-05-20', assigned_to: 'user-2',
    notes: 'Cover background, problem statement, objectives, and scope. Target 400–600 words. Use IEEE citation format. Refer to the original project proposal for the approved problem statement. Completed and reviewed.',
    created_at: '2026-04-05',
  },
  {
    id: 'pjt4', project_id: 'proj3', title: 'Prepare slide deck',
    type: 'group', status: 'in_progress', difficulty: 3, progress: 65,
    due_date: '2026-05-25', assigned_to: 'user-1',
    notes: 'Final presentation slides for WIA2005. Cover: introduction, system overview, live demo walkthrough, results and evaluation, and conclusion. Maximum 15 slides. Use the faculty-approved slide template. Rehearsal scheduled the day before.',
    created_at: '2026-04-16',
  },
]

export const MOCK_PROJECT_LINKS: ProjectLink[] = [
  { id: 'pl1', project_id: 'proj1', label: 'Google Drive Folder', url: '#' },
  { id: 'pl2', project_id: 'proj1', label: 'Project Rules.pdf', url: '#' },
]

// Per-task links and checklists — keyed by task id
export const MOCK_TASK_LINKS: Record<string, TaskLink[]> = {
  pt1: [
    { label: 'Lecture Slides — Chapter 4', url: '#' },
    { label: 'Subnetting Practice Problems', url: '#' },
  ],
  pt2: [
    { label: 'Lab 3 Guidelines (PDF)', url: '#' },
    { label: 'Submission Portal', url: '#' },
  ],
  pt3: [
    { label: 'Past Year Paper 2025', url: '#' },
    { label: 'Lecture Notes (Week 1–7)', url: '#' },
  ],
  pt4: [
    { label: 'SE Project Brief', url: '#' },
    { label: 'Figma Wireframe Template', url: '#' },
  ],
  pjt1: [
    { label: "Dijkstra's Algorithm Reference", url: '#' },
  ],
  pjt2: [
    { label: 'Draft Schema v1', url: '#' },
    { label: 'DB Naming Convention Guide', url: '#' },
  ],
  pjt4: [
    { label: 'Faculty Slide Template', url: '#' },
  ],
}

export const MOCK_TASK_CHECKLISTS: Record<string, TaskChecklistItem[]> = {
  pt1: [
    { id: 'pt1-c1', text: 'Read Chapter 4 — Subnetting & CIDR notation', done: false },
    { id: 'pt1-c2', text: 'Read Chapter 5 — IPv6 address formatting', done: false },
    { id: 'pt1-c3', text: 'Complete subnetting practice problems', done: false },
    { id: 'pt1-c4', text: 'Prepare questions for tutorial session', done: false },
  ],
  pt2: [
    { id: 'pt2-c1', text: 'Set up Packet Tracer topology (3 routers)', done: true },
    { id: 'pt2-c2', text: 'Configure routing tables', done: true },
    { id: 'pt2-c3', text: 'Take screenshots of working configuration', done: false },
    { id: 'pt2-c4', text: 'Write lab report with analysis', done: false },
    { id: 'pt2-c5', text: 'Submit .pkt file and PDF via portal', done: false },
  ],
  pt3: [
    { id: 'pt3-c1', text: "Review Nielsen's 10 usability heuristics", done: false },
    { id: 'pt3-c2', text: 'Study user research methods (Week 3)', done: false },
    { id: 'pt3-c3', text: 'Revise wireframing and prototyping principles', done: false },
    { id: 'pt3-c4', text: 'Attempt past year paper (timed)', done: false },
    { id: 'pt3-c5', text: 'Review accessibility guidelines', done: false },
  ],
  pt4: [
    { id: 'pt4-c1', text: 'Login page wireframe', done: false },
    { id: 'pt4-c2', text: 'Dashboard wireframe', done: false },
    { id: 'pt4-c3', text: 'Task management screen wireframe', done: false },
    { id: 'pt4-c4', text: 'Add navigation flow arrows', done: false },
    { id: 'pt4-c5', text: 'Annotate key interactions and components', done: false },
  ],
  pjt1: [
    { id: 'pjt1-c1', text: "Write pseudocode for Dijkstra's algorithm", done: true },
    { id: 'pjt1-c2', text: 'Add time complexity analysis (Big-O)', done: true },
    { id: 'pjt1-c3', text: 'Add input/output specification', done: false },
    { id: 'pjt1-c4', text: 'Format and polish slide (max 2 slides)', done: false },
  ],
  pjt2: [
    { id: 'pjt2-c1', text: 'List all entities and attributes', done: false },
    { id: 'pjt2-c2', text: 'Define primary and foreign keys', done: false },
    { id: 'pjt2-c3', text: 'Draw ER diagram', done: false },
    { id: 'pjt2-c4', text: 'Cross-check with API design', done: false },
    { id: 'pjt2-c5', text: 'Get leader approval before submission', done: false },
  ],
  pjt3: [
    { id: 'pjt3-c1', text: 'Write background section', done: true },
    { id: 'pjt3-c2', text: 'Define problem statement', done: true },
    { id: 'pjt3-c3', text: 'List project objectives', done: true },
    { id: 'pjt3-c4', text: 'Define scope and limitations', done: true },
  ],
  pjt4: [
    { id: 'pjt4-c1', text: 'Introduction and background slide', done: true },
    { id: 'pjt4-c2', text: 'System architecture overview', done: true },
    { id: 'pjt4-c3', text: 'Demo screenshots / walkthrough slides', done: false },
    { id: 'pjt4-c4', text: 'Results and evaluation slide', done: false },
    { id: 'pjt4-c5', text: 'Conclusion and Q&A prep', done: false },
  ],
}

// Derived helpers

export function getMockTaskCards(): TaskCardData[] {
  const courseMap = Object.fromEntries(MOCK_COURSES.map((c) => [c.id, c]))

  const personal: TaskCardData[] = MOCK_PERSONAL_TASKS.map((t) => {
    const course = t.course_id ? courseMap[t.course_id] : undefined
    return {
      id: t.id,
      title: t.title,
      type: 'personal',
      status: t.status,
      risk: calculateRisk({ status: t.status, due_date: t.due_date, progress: t.progress, difficulty: t.difficulty }),
      difficulty: t.difficulty,
      progress: t.progress,
      due_date: t.due_date,
      source_label: course ? `${course.code} — ${course.name}` : 'No course',
      course_id: t.course_id,
      notes: t.notes,
      links: MOCK_TASK_LINKS[t.id],
      checklist: MOCK_TASK_CHECKLISTS[t.id],
    }
  })

  const projectMap = Object.fromEntries(MOCK_PROJECTS.map((p) => [p.id, p]))

  const assigned: TaskCardData[] = MOCK_PROJECT_TASKS
    .filter((t) => t.assigned_to === MOCK_USER.id)
    .map((t) => {
      const project = projectMap[t.project_id]
      const course = project ? courseMap[project.course_id] : undefined
      return {
        id: t.id,
        title: t.title,
        type: 'group',
        status: t.status,
        risk: calculateRisk({ status: t.status, due_date: t.due_date, progress: t.progress, difficulty: t.difficulty }),
        difficulty: t.difficulty,
        progress: t.progress,
        due_date: t.due_date,
        source_label: project ? `${project.name}` : 'Unknown project',
        project_id: t.project_id,
        course_id: course?.id,
        notes: t.notes,
        links: MOCK_TASK_LINKS[t.id],
        checklist: MOCK_TASK_CHECKLISTS[t.id],
        assigned_to: t.assigned_to,
      }
    })

  return [...personal, ...assigned]
}

export function getMockProjectCards(): ProjectCardData[] {
  const courseMap = Object.fromEntries(MOCK_COURSES.map((c) => [c.id, c]))
  const memberMap: Record<string, ProjectMember[]> = {}
  MOCK_PROJECT_MEMBERS.forEach((m) => {
    if (!memberMap[m.project_id]) memberMap[m.project_id] = []
    memberMap[m.project_id].push(m)
  })
  const taskMap: Record<string, ProjectTask[]> = {}
  MOCK_PROJECT_TASKS.forEach((t) => {
    if (!taskMap[t.project_id]) taskMap[t.project_id] = []
    taskMap[t.project_id].push(t)
  })

  return MOCK_PROJECTS.map((p) => {
    const course = courseMap[p.course_id]
    const members = memberMap[p.id] ?? []
    const tasks = taskMap[p.id] ?? []
    const userMember = members.find((m) => m.user_id === MOCK_USER.id)
    const completedTasks = tasks.filter((t) => t.status === 'done').length
    const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

    return {
      id: p.id,
      name: p.name,
      course_code: course?.code ?? '',
      course_name: course?.name ?? '',
      deadline: p.deadline,
      member_count: members.length,
      user_role: userMember?.role ?? 'member',
      progress,
      risk: calculateProjectRisk(tasks),
      status: p.status,
      completed_at: p.completed_at,
    }
  })
}

// Full detail for a single project page
export function getMockProjectDetail(projectId: string) {
  const project = MOCK_PROJECTS.find((p) => p.id === projectId)
  if (!project) return null

  const course = MOCK_COURSES.find((c) => c.id === project.course_id)
  const members = MOCK_PROJECT_MEMBERS.filter((m) => m.project_id === projectId)
  const tasks = MOCK_PROJECT_TASKS.filter((t) => t.project_id === projectId)
  const links = MOCK_PROJECT_LINKS.filter((l) => l.project_id === projectId)
  const userMember = members.find((m) => m.user_id === MOCK_USER.id)
  const completedTasks = tasks.filter((t) => t.status === 'done').length
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

  const enrichedMembers = members.map((m) => ({
    ...m,
    name: MOCK_MEMBERS[m.user_id]?.name ?? m.user_id,
    email: MOCK_MEMBERS[m.user_id]?.email ?? '',
  }))

  const enrichedTasks: TaskCardData[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    type: 'group',
    status: t.status,
    risk: calculateRisk({ status: t.status, due_date: t.due_date, progress: t.progress, difficulty: t.difficulty }),
    difficulty: t.difficulty,
    progress: t.progress,
    due_date: t.due_date,
    source_label: project.name,
    project_id: project.id,
    notes: t.notes,
    links: MOCK_TASK_LINKS[t.id],
    checklist: MOCK_TASK_CHECKLISTS[t.id],
    assigned_to: t.assigned_to,
  }))

  return {
    project,
    course,
    members: enrichedMembers,
    tasks: enrichedTasks,
    rawTasks: tasks,
    links,
    userRole: userMember?.role ?? 'member',
    progress,
    risk: calculateProjectRisk(tasks),
  }
}
