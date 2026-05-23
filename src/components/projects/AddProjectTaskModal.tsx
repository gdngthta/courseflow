'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SelectInput } from '@/components/ui/SelectInput'
import type { Difficulty } from '@/types'

interface Member { id: string; name: string }

interface AddProjectTaskModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: AddProjectTaskData) => void
  members: Member[]
}

export interface AddProjectTaskData {
  title: string
  assigned_to: string
  due_date: string
  difficulty: Difficulty
  notes: string
}

const DIFFICULTY_OPTIONS = [
  { value: '1', label: '1 — Very Easy' },
  { value: '2', label: '2 — Easy' },
  { value: '3', label: '3 — Medium' },
  { value: '4', label: '4 — Hard' },
  { value: '5', label: '5 — Very Hard' },
]

export function AddProjectTaskModal({ open, onClose, onSubmit, members }: AddProjectTaskModalProps) {
  const [form, setForm] = useState<AddProjectTaskData>({
    title: '', assigned_to: '', due_date: '', difficulty: 3, notes: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof AddProjectTaskData, string>>>({})

  const memberOptions = members.map((m) => ({ value: m.id, label: m.name }))

  const validate = () => {
    const e: typeof errors = {}
    if (!form.title.trim()) e.title = 'Task title is required'
    if (!form.due_date) e.due_date = 'Due date is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onSubmit(form)
    setForm({ title: '', assigned_to: '', due_date: '', difficulty: 3, notes: '' })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Project Task" maxWidth="max-w-md">
      <div className="flex flex-col gap-4">
        <Input
          label="Task Title"
          placeholder="e.g., Draft introduction section"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          error={errors.title}
        />
        <SelectInput
          label="Assign To"
          placeholder="Select an option"
          options={memberOptions}
          value={form.assigned_to}
          onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Due Date"
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            error={errors.due_date}
          />
          <SelectInput
            label="Difficulty"
            options={DIFFICULTY_OPTIONS}
            value={String(form.difficulty)}
            onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) as Difficulty })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-300">Instructions / Notes (Optional)</label>
          <textarea
            rows={3}
            placeholder="Add instructions or context for the assigned member..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:border-indigo-500 focus:ring-indigo-500 transition resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Add Task</Button>
        </div>
      </div>
    </Modal>
  )
}
