'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SelectInput } from '@/components/ui/SelectInput'
import type { Course, TaskCardData, Difficulty, TaskStatus } from '@/types'

interface TaskFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: TaskFormData) => void
  courses: Course[]
  editingTask?: TaskCardData | null
}

export interface TaskFormData {
  title: string
  course_id: string
  due_date: string
  difficulty: Difficulty
  status: TaskStatus
  progress: number
  notes: string
}

const DIFFICULTY_OPTIONS = [
  { value: '1', label: '1 — Very Easy' },
  { value: '2', label: '2 — Easy' },
  { value: '3', label: '3 — Medium' },
  { value: '4', label: '4 — Hard' },
  { value: '5', label: '5 — Very Hard' },
]

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

export function TaskFormModal({ open, onClose, onSubmit, courses, editingTask }: TaskFormModalProps) {
  const isEditing = !!editingTask

  const [form, setForm] = useState<TaskFormData>({
    title: '',
    course_id: '',
    due_date: '',
    difficulty: 3,
    status: 'not_started',
    progress: 0,
    notes: '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({})

  useEffect(() => {
    if (editingTask) {
      setForm({
        title: editingTask.title,
        course_id: editingTask.course_id ?? '',
        due_date: editingTask.due_date,
        difficulty: editingTask.difficulty,
        status: editingTask.status,
        progress: editingTask.progress,
        notes: editingTask.notes ?? '',
      })
    } else {
      setForm({ title: '', course_id: '', due_date: '', difficulty: 3, status: 'not_started', progress: 0, notes: '' })
    }
    setErrors({})
  }, [editingTask, open])

  const courseOptions = courses.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` }))

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
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'Create New Personal Task'}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Task Title"
          placeholder="e.g., Read Chapter 4"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          error={errors.title}
        />

        <SelectInput
          label="Course (Optional)"
          placeholder="Select a course..."
          options={courseOptions}
          value={form.course_id}
          onChange={(e) => setForm({ ...form, course_id: e.target.value })}
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

        {isEditing && (
          <div className="grid grid-cols-2 gap-3">
            <SelectInput
              label="Status"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">
                Progress: {form.progress}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={form.progress}
                onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-300">Notes (Optional)</label>
          <textarea
            rows={3}
            placeholder="Add any notes or details..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:border-indigo-500 focus:ring-indigo-500 transition resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>
            {isEditing ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
