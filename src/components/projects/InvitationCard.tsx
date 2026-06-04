'use client'

import { useState } from 'react'
import { UserPlus, X, ChevronDown, ChevronUp } from 'lucide-react'
import type { ReceivedInvitation } from '@/lib/api/invitations'
import type { Course } from '@/types'

const ROLE_LABEL: Record<string, string> = { admin: 'Editor', member: 'Viewer' }

interface Props {
  invitation: ReceivedInvitation
  userCourses: Course[]
  onAccept: (id: string, displayName?: string, personalCourseId?: string) => Promise<{ ok: boolean; error?: string }>
  onDecline: (id: string) => Promise<{ ok: boolean; error?: string }>
}

export function InvitationCard({ invitation, userCourses, onAccept, onDecline }: Props) {
  const [accepting, setAccepting] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [actionError, setActionError] = useState('')

  // Personalization (optional, expandable)
  const [showPersonalize, setShowPersonalize] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [personalCourseId, setPersonalCourseId] = useState('')

  const roleLabel = ROLE_LABEL[invitation.role] ?? invitation.role
  const hasSharedCourse = !!(invitation.course_code && invitation.course_name)
  const activeCourses = userCourses.filter((c) => !c.is_archived)

  const handleAccept = async () => {
    setAccepting(true)
    setActionError('')
    const result = await onAccept(
      invitation.id,
      displayName.trim() || undefined,
      personalCourseId || undefined
    )
    setAccepting(false)
    if (!result.ok) setActionError(result.error ?? 'Failed to accept invitation.')
  }

  const handleDecline = async () => {
    setDeclining(true)
    setActionError('')
    const result = await onDecline(invitation.id)
    setDeclining(false)
    if (!result.ok) setActionError(result.error ?? 'Failed to decline invitation.')
  }

  return (
    <div className="bg-slate-900 border border-indigo-800/40 rounded-xl p-5">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-indigo-700/50 flex items-center justify-center flex-shrink-0 mt-0.5">
          <UserPlus size={16} className="text-indigo-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{invitation.project_name}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Invited by <span className="text-slate-200">{invitation.inviter_name}</span>
            {' · '}Role: <span className="text-indigo-300">{roleLabel}</span>
          </p>
          {hasSharedCourse && (
            <p className="text-xs text-slate-500 mt-1">
              Shared course: {invitation.course_code} — {invitation.course_name}
            </p>
          )}
        </div>
      </div>

      {/* Action error */}
      {actionError && (
        <p className="mt-3 text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
          {actionError}
        </p>
      )}

      {/* Personalization (optional) */}
      <div className="mt-4">
        <button
          onClick={() => setShowPersonalize((v) => !v)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          {showPersonalize ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Personalize how this project appears in your workspace (optional)
        </button>

        {showPersonalize && (
          <div className="mt-3 space-y-3 border-t border-slate-800 pt-3">
            {hasSharedCourse && (
              <p className="text-xs text-slate-500">
                This project is linked to{' '}
                <span className="text-slate-300">{invitation.course_code} — {invitation.course_name}</span>.
                You can keep it as shared context, or link it to one of your own courses below.
              </p>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Display name <span className="text-slate-600">(optional — overrides project name for you)</span>
              </label>
              <input
                type="text"
                placeholder={invitation.project_name}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {activeCourses.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Link to your course <span className="text-slate-600">(optional)</span>
                </label>
                <select
                  value={personalCourseId}
                  onChange={(e) => setPersonalCourseId(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition appearance-none"
                >
                  <option value="" className="bg-slate-800">Keep shared course context</option>
                  {activeCourses.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-800">
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={handleAccept}
          disabled={accepting || declining}
          className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {accepting ? 'Accepting…' : 'Accept'}
        </button>
        <button
          onClick={handleDecline}
          disabled={accepting || declining}
          className="py-2 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-sm font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
        >
          <X size={13} />
          {declining ? 'Declining…' : 'Decline'}
        </button>
      </div>
    </div>
  )
}
