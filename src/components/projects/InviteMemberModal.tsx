'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SelectInput } from '@/components/ui/SelectInput'
import type { ProjectRole } from '@/types'

interface InviteMemberModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { email: string; role: ProjectRole }) => void
}

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' },
]

export function InviteMemberModal({ open, onClose, onSubmit }: InviteMemberModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ProjectRole>('member')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!email.trim()) { setError('Email is required'); return }
    onSubmit({ email, role })
    setEmail('')
    setRole('member')
    setError('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Invite Member" maxWidth="max-w-sm">
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
          An invite will be sent to the email address. (Mock — no email sent in Phase 1.)
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Send Invite</Button>
        </div>
      </div>
    </Modal>
  )
}
