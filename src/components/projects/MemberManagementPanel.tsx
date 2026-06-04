'use client'

import { useState } from 'react'
import { UserPlus, LogOut, ShieldCheck, Eye, UserMinus, AlertTriangle } from 'lucide-react'
import { RoleBadge } from '@/components/ui/Badge'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import type { ProjectRole } from '@/types'
import type { ProjectMemberWithProfile } from '@/lib/api/projects'
import type { MemberActionResult } from '@/lib/api/projectMembers'

// Minimal task shape — satisfied by both ProjectTask and TaskCardData.
interface TaskForPanel {
  assigned_to?: string | null
  status: string
}

interface Props {
  members: ProjectMemberWithProfile[]
  tasks: TaskForPanel[]
  userId: string
  userRole: ProjectRole
  isCompleted: boolean
  onAddMember: () => void
  onChangeRole: (targetUserId: string, newRole: 'admin' | 'member') => Promise<MemberActionResult>
  onRemoveMember: (targetUserId: string) => Promise<MemberActionResult>
  onLeaveProject: () => Promise<MemberActionResult>
}

const ROLE_DISPLAY: Record<ProjectRole, string> = {
  leader: 'Leader',
  admin: 'Editor',
  member: 'Viewer',
}

export function MemberManagementPanel({
  members,
  tasks,
  userId,
  userRole,
  isCompleted,
  onAddMember,
  onChangeRole,
  onRemoveMember,
  onLeaveProject,
}: Props) {
  // ── Action in-progress state ──
  const [actionError, setActionError] = useState('')
  const [processingUserId, setProcessingUserId] = useState<string | null>(null)

  // ── Remove member confirm ──
  const [confirmRemove, setConfirmRemove] = useState<ProjectMemberWithProfile | null>(null)
  const [removing, setRemoving] = useState(false)

  // ── Leave project confirm ──
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const isLeader = userRole === 'leader'

  /** Active (non-done) tasks assigned to a given user in this project. */
  function activeTasks(memberId: string) {
    return tasks.filter((t) => t.assigned_to === memberId && t.status !== 'done')
  }

  const handleChangeRole = async (target: ProjectMemberWithProfile, newRole: 'admin' | 'member') => {
    setActionError('')
    setProcessingUserId(target.user_id)
    const result = await onChangeRole(target.user_id, newRole)
    setProcessingUserId(null)
    if (!result.ok) setActionError(result.error ?? 'Failed to change role.')
  }

  const handleRemoveConfirm = async () => {
    if (!confirmRemove) return
    setRemoving(true)
    setActionError('')
    const result = await onRemoveMember(confirmRemove.user_id)
    setRemoving(false)
    if (result.ok) {
      setConfirmRemove(null)
    } else {
      setConfirmRemove(null)
      setActionError(result.error ?? 'Failed to remove member.')
    }
  }

  const handleLeaveConfirm = async () => {
    setLeaving(true)
    setActionError('')
    const result = await onLeaveProject()
    setLeaving(false)
    if (result.ok) {
      setConfirmLeave(false)
      // DataContext refetches projects; the page will redirect automatically
      // because `detail` will be null for this project after leaving.
    } else {
      setConfirmLeave(false)
      setActionError(result.error ?? 'Failed to leave project.')
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Members</h3>
        {isLeader && !isCompleted && (
          <button
            onClick={onAddMember}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <UserPlus size={12} /> Add member
          </button>
        )}
      </div>

      {/* Action error banner */}
      {actionError && (
        <div className="flex items-start gap-2 mb-4 px-3 py-2 bg-red-900/20 border border-red-800/40 rounded-lg">
          <AlertTriangle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{actionError}</p>
        </div>
      )}

      {/* Member rows */}
      <div className="space-y-3">
        {members.map((m) => {
          const isSelf = m.user_id === userId
          const isProcessing = processingUserId === m.user_id
          const memberActiveTasks = activeTasks(m.user_id)
          const hasActiveTasks = memberActiveTasks.length > 0

          return (
            <div key={m.id} className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-semibold">
                  {m.name.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm text-slate-200 truncate">{m.name}</p>
                  {isSelf && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 border border-slate-600 leading-none">
                      You
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{m.email}</p>
                {/* Active task count warning for leaders viewing others */}
                {isLeader && !isSelf && hasActiveTasks && (
                  <p className="text-[11px] text-amber-400/80 mt-0.5">
                    {memberActiveTasks.length} active task{memberActiveTasks.length !== 1 ? 's' : ''} assigned
                  </p>
                )}
              </div>

              {/* Role + actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <RoleBadge role={m.role} />

                {/* Leader actions for non-self, non-leader targets, on active projects */}
                {isLeader && !isSelf && m.role !== 'leader' && !isCompleted && (
                  <div className="flex items-center gap-1 ml-1">
                    {/* Toggle role button */}
                    <button
                      onClick={() =>
                        handleChangeRole(m, m.role === 'admin' ? 'member' : 'admin')
                      }
                      disabled={isProcessing}
                      title={m.role === 'admin' ? 'Change to Viewer' : 'Change to Editor'}
                      className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-700 disabled:opacity-40 transition-colors"
                    >
                      {m.role === 'admin' ? (
                        <Eye size={13} />
                      ) : (
                        <ShieldCheck size={13} />
                      )}
                    </button>

                    {/* Remove button */}
                    <button
                      onClick={() => {
                        setActionError('')
                        setConfirmRemove(m)
                      }}
                      disabled={isProcessing}
                      title="Remove member"
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-900/20 disabled:opacity-40 transition-colors"
                    >
                      <UserMinus size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Leave project — non-leaders on active projects */}
      {userRole !== 'leader' && !isCompleted && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <button
            onClick={() => {
              setActionError('')
              setConfirmLeave(true)
            }}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={12} />
            Leave project
          </button>
        </div>
      )}

      {/* ── Remove confirm modal ── */}
      {confirmRemove && (
        <ConfirmModal
          open={!!confirmRemove}
          onClose={() => setConfirmRemove(null)}
          onConfirm={handleRemoveConfirm}
          title="Remove member"
          description={
            activeTasks(confirmRemove.user_id).length > 0
              ? `${confirmRemove.name} has ${activeTasks(confirmRemove.user_id).length} active task(s). Reassign or complete them before removing.`
              : `Remove ${confirmRemove.name} (${ROLE_DISPLAY[confirmRemove.role]}) from this project? They will lose access immediately.`
          }
          confirmLabel="Remove"
          loading={removing}
        />
      )}

      {/* ── Leave confirm modal ── */}
      <ConfirmModal
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={handleLeaveConfirm}
        title="Leave project"
        description="You will lose access to this project and its tasks. This cannot be undone from your side — a Leader must re-add you."
        confirmLabel="Leave"
        loading={leaving}
      />
    </div>
  )
}
