'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SelectInput } from '@/components/ui/SelectInput'
import type { Course } from '@/types'

interface CreateProjectModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateProjectData) => Promise<void>
  courses: Course[]
}

export interface CreateProjectData {
  name: string
  course_id: string
  deadline: string
}

export function CreateProjectModal({ open, onClose, onSubmit, courses }: CreateProjectModalProps) {
  const [form, setForm] = useState<CreateProjectData>({ name: '', course_id: '', deadline: '' })
  const [errors, setErrors] = useState<Partial<CreateProjectData>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const courseOptions = courses.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` }))

  const validate = () => {
    const e: Partial<CreateProjectData> = {}
    if (!form.name.trim()) e.name = 'Project name is required'
    if (!form.deadline) e.deadline = 'Deadline is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await onSubmit(form)
      setForm({ name: '', course_id: '', deadline: '' })
      onClose()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create New Project" maxWidth="max-w-md">
      <div className="flex flex-col gap-4">
        <Input
          label="Project Name"
          placeholder="e.g., Final Group Presentation"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
        />
        <SelectInput
          label="Course (Optional)"
          placeholder="Select a course..."
          options={courseOptions}
          value={form.course_id}
          onChange={(e) => setForm({ ...form, course_id: e.target.value })}
        />
        <Input
          label="Project Deadline"
          type="date"
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          error={errors.deadline}
        />
        <p className="text-xs text-slate-500">
          You will be set as the project Leader. Members can be invited after creation.
        </p>
        {submitError && (
          <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">{submitError}</p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Project'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
