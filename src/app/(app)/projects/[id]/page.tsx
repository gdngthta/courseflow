'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Plus, CheckCircle2, Lock, Info } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { AddProjectTaskModal, type AddProjectTaskData } from '@/components/projects/AddProjectTaskModal'
import { InviteMemberModal } from '@/components/projects/InviteMemberModal'
import { CompleteProjectModal } from '@/components/projects/CompleteProjectModal'
import { MemberManagementPanel } from '@/components/projects/MemberManagementPanel'
import { RiskBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useData } from '@/contexts/DataContext'
import { toProjectDetail } from '@/lib/projectDerive'
import { formatFullDate } from '@/lib/utils'
import type { TaskCardData, TaskChecklistItem, ProjectRole } from '@/types'

// Friendly display labels for the three DB roles.
const ROLE_DISPLAY: Record<ProjectRole, string> = {
  leader: 'Leader',
  admin: 'Editor',
  member: 'Viewer',
}

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params?.id as string

  const {
    userId, courses, projects, projectsLoading, error,
    addProjectTask, updateProjectTaskNotes, deleteProjectTask,
    markProjectTaskDone, completeProject, reopenProject, updateProjectTaskChecklist,
    inviteMember, updateMemberRole, removeMember, leaveProject, cancelInvitation,
  } = useData()
  const [reopening, setReopening] = useState(false)

  const [selectedTask, setSelectedTask] = useState<TaskCardData | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [mutationError, setMutationError] = useState('')

  const detail = useMemo(
    () => toProjectDetail(projects, projectId, userId, courses),
    [projects, projectId, userId, courses]
  )

  if (projectsLoading && !detail) {
    return (
      <>
        <Topbar title="Project Detail" />
        <div className="p-6">
          <div className="flex items-center justify-center py-20 text-sm text-slate-500">Loading project…</div>
        </div>
      </>
    )
  }

  if (!detail) {
    return (
      <>
        <Topbar title="Project Detail" />
        <div className="p-6">
          <Link href="/projects" className="text-sm text-slate-400 hover:text-slate-200 transition-colors mb-4 inline-block">
            ← Back to Projects
          </Link>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
            <p className="text-slate-400">Project not found.</p>
          </div>
        </div>
      </>
    )
  }

  const { project, course, links, userRole, tasks, members, invitations, effectiveName } = detail
  const isCompleted = project.status === 'completed'
  const completedAt = project.completed_at
  const completedCount = tasks.filter((t) => t.status === 'done').length
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0
  const canManage = userRole === 'leader' || userRole === 'admin'
  const unfinishedTasks = tasks.filter((t) => t.status !== 'done')

  // Detect whether the project's course belongs to this user or to another
  // user (shared project context). A shared course means the user was added
  // to the project by someone else whose course we don't own.
  const ownCourseIds = new Set(courses.map((c) => c.id))
  const isSharedCourse = course ? !ownCourseIds.has(course.id) : false

  const memberOptions = members.map((m) => ({ id: m.user_id, name: m.name }))
  const assigneeName = selectedTask?.assigned_to
    ? members.find((m) => m.user_id === selectedTask.assigned_to)?.name
    : undefined

  // ── Handlers ──

  const handleAddTask = async (data: AddProjectTaskData) => {
    await addProjectTask({
      project_id: project.id,
      title: data.title,
      assigned_to: data.assigned_to || undefined,
      due_date: data.due_date,
      difficulty: data.difficulty,
      notes: data.notes || undefined,
      links: data.links,
      checklist: data.checklist.filter((i) => i.text.trim()),
    })
  }

  const handleUpdateNotes = async (task: TaskCardData, notes: string) => {
    await updateProjectTaskNotes(task.id, notes)
  }

  const handleDeleteTask = async (task: TaskCardData) => {
    await deleteProjectTask(task.id)
  }

  const handleMarkDone = async (task: TaskCardData) => {
    await markProjectTaskDone(task.id)
  }

  const handleCompleteProject = async () => {
    setMutationError('')
    try {
      await completeProject(project.id)
      setShowCompleteModal(false)
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to complete project.')
      setShowCompleteModal(false)
    }
  }

  const handleChecklistUpdate = (taskId: string, checklist: TaskChecklistItem[]) => {
    updateProjectTaskChecklist(taskId, checklist)
  }

  const handleInvite = async ({ email, role }: { email: string; role: ProjectRole }) => {
    return inviteMember(project.id, email, role === 'admin' ? 'admin' : 'member')
  }

  return (
    <>
      <Topbar title="Projects" />
      <div className="p-6 max-w-[1200px]">
        {/* Back */}
        <Link href="/projects" className="text-sm text-slate-400 hover:text-slate-200 transition-colors mb-5 inline-flex items-center gap-1">
          ← Back to Projects
        </Link>

        {/* Data / mutation error banners */}
        {(error || mutationError) && (
          <div className="mb-4 px-4 py-3 bg-red-900/20 border border-red-800/40 rounded-lg text-sm text-red-400">
            {mutationError || error}
          </div>
        )}

        {/* Shared course context callout */}
        {isSharedCourse && course && (
          <div className="flex items-start gap-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl px-5 py-3 mb-4">
            <Info size={15} className="text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-indigo-300">Shared project</p>
              <p className="text-xs text-slate-400 mt-0.5">
                This project is linked to{' '}
                <span className="text-slate-200 font-medium">{course.code} — {course.name}</span>,
                a course owned by another team member. Tasks assigned to you appear in{' '}
                <span className="text-slate-200">My Tasks</span> under that course context.
                You can personalize your view by filtering courses in My Tasks.
              </p>
            </div>
          </div>
        )}

        {/* Completed banner */}
        {isCompleted && (
          <div className="flex items-center gap-3 bg-emerald-900/20 border border-emerald-800/40 rounded-xl px-5 py-3 mb-6">
            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-400">Project Completed</p>
              {completedAt && (
                <p className="text-xs text-slate-400 mt-0.5">Completed on {formatFullDate(completedAt)}</p>
              )}
            </div>
            {userRole === 'leader' ? (
              <button
                onClick={async () => {
                  setReopening(true)
                  setMutationError('')
                  try {
                    await reopenProject(project.id)
                  } catch (err) {
                    setMutationError(err instanceof Error ? err.message : 'Failed to reopen project.')
                  } finally {
                    setReopening(false)
                  }
                }}
                disabled={reopening}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {reopening ? 'Reopening…' : 'Reopen project'}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Lock size={11} />
                Read-only
              </div>
            )}
          </div>
        )}

        {/* Project header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-semibold text-white">{effectiveName}</h2>
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900/40 text-emerald-400 border border-emerald-800/50">
                  <CheckCircle2 size={10} />
                  Completed
                </span>
              ) : (
                <RiskBadge risk={detail.risk} />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {isSharedCourse ? (
                <span className="text-sm text-slate-400">
                  Shared project course:{' '}
                  <span className="text-slate-200 font-medium">
                    {course?.code} — {course?.name}
                  </span>
                </span>
              ) : (
                <p className="text-sm text-slate-400">{course?.code} — {course?.name}</p>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
              {isCompleted && completedAt ? (
                <span>Completed: {formatFullDate(completedAt)}</span>
              ) : (
                <span>Due: {formatFullDate(project.deadline)}</span>
              )}
              <span>Team: {members.length} member{members.length !== 1 ? 's' : ''}</span>
              <span>Your Role: <span className="text-slate-200 font-medium">{ROLE_DISPLAY[userRole]}</span></span>
            </div>
          </div>

          {/* Mark as Completed — leader only, active project only */}
          {!isCompleted && userRole === 'leader' && (
            <button
              onClick={() => setShowCompleteModal(true)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <CheckCircle2 size={15} />
              Mark as Completed
            </button>
          )}
        </div>

        {/* Overall progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-white">Overall Progress</p>
              <p className="text-xs text-slate-400 mt-0.5">Based on completed tasks</p>
            </div>
            <span className="text-2xl font-bold text-white">{progress}%</span>
          </div>
          <ProgressBar value={progress} />
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: tasks */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">
                Project Tasks
                {isCompleted && <span className="ml-2 text-xs text-slate-500 font-normal">(read-only)</span>}
              </h3>
              {canManage && !isCompleted && (
                <button
                  onClick={() => setShowAddTask(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  <Plus size={13} /> Add Task
                </button>
              )}
            </div>

            {tasks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={setSelectedTask}
                    assigneeName={
                      task.assigned_to
                        ? members.find((m) => m.user_id === task.assigned_to)?.name
                        : undefined
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
                <p className="text-slate-400 text-sm">No tasks yet.</p>
                {canManage && !isCompleted && (
                  <button
                    onClick={() => setShowAddTask(true)}
                    className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    + Add the first task
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: members + links */}
          <div className="flex flex-col gap-5">
            {/* Members */}
            <MemberManagementPanel
              members={members}
              invitations={invitations}
              tasks={tasks}
              userId={userId}
              userRole={userRole}
              isCompleted={isCompleted}
              onAddMember={() => setShowInvite(true)}
              onChangeRole={(targetUserId, newRole) =>
                updateMemberRole(project.id, targetUserId, newRole)
              }
              onRemoveMember={(targetUserId) =>
                removeMember(project.id, targetUserId)
              }
              onLeaveProject={() => leaveProject(project.id)}
              onCancelInvitation={(invitationId) =>
                cancelInvitation(invitationId)
              }
            />

            {/* Important Links */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Important Links</h3>
              </div>
              {links.length > 0 ? (
                <div className="space-y-2">
                  {links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-slate-300 hover:text-indigo-400 transition-colors"
                    >
                      <ExternalLink size={13} className="text-slate-500 flex-shrink-0" />
                      {link.label}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No links added yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onDelete={isCompleted ? undefined : handleDeleteTask}
        onMarkDone={isCompleted ? undefined : handleMarkDone}
        onUpdateNotes={isCompleted ? undefined : handleUpdateNotes}
        onChecklistUpdate={isCompleted ? undefined : handleChecklistUpdate}
        userRole={userRole}
        assigneeName={assigneeName}
      />

      {!isCompleted && (
        <>
          <AddProjectTaskModal
            open={showAddTask}
            onClose={() => setShowAddTask(false)}
            onSubmit={handleAddTask}
            members={memberOptions}
            projectDeadline={project.deadline}
          />

          <InviteMemberModal
            open={showInvite}
            onClose={() => setShowInvite(false)}
            onSubmit={handleInvite}
          />
        </>
      )}

      <CompleteProjectModal
        open={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onConfirm={handleCompleteProject}
        unfinishedTasks={unfinishedTasks}
      />
    </>
  )
}
