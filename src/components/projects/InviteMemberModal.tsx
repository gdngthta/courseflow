'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SelectInput } from '@/components/ui/SelectInput'
import type { ProjectRole } from '@/types'

interface InviteResult {
  ok: boolean
  error?: string
}

interface InviteMemberModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { email: string; role: ProjectRole }) => Promise<InviteResult>
}

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' },
]

export function InviteMemberModal({ open, onClose, onSubmit }: InviteMemberModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ProjectRole>('member')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setEmail('')
      setRole('member')
      setError('')
      setSubmitting(false)
      setSent(false)
    }
  }, [open])

  const handleSubmit = async () => {
    if (!email.trim()) { setError('Email is required'); return }
    if (!email.includes('@')) { setError('Please enter a valid email address'); return }

    setSubmitting(true)
    setError('')
    const result = await onSubmit({ email, role })
    setSubmitting(false)

    if (!result.ok) {
      setError(result.error ?? 'Failed to send invite')
      return
    }
    setSent(true)
    setTimeout(() => onClose(), 2000)
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Member by Email" maxWidth="max-w-sm">
      {sent ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 size={24} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Member added!</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{email}</p>
          </div>
          <p className="text-xs text-slate-500">
            They now have access to this project.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="student@university.edu"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError('') }}
            error={error}
          />
          <SelectInput
            label="Role"
            placeholder="Select an option"
            options={ROLE_OPTIONS}
            value={role}
            onChange={(e) => setRole(e.target.value as ProjectRole)}
          />
          <p className="text-xs text-slate-500">
            The person must already have a CourseFlow account. They&apos;ll be added to the project immediately.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Adding…' : 'Add Member'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
