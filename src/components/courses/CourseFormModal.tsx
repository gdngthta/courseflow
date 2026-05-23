'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Course } from '@/types'

const PRESET_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ec4899',
  '#06b6d4', '#f97316', '#8b5cf6', '#64748b',
]

interface CourseFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CourseFormData) => void
  editingCourse?: Course | null
}

export interface CourseFormData {
  code: string
  name: string
  lecturer: string
  semester: string
  color: string
}

export function CourseFormModal({ open, onClose, onSubmit, editingCourse }: CourseFormModalProps) {
  const isEditing = !!editingCourse

  const [form, setForm] = useState<CourseFormData>({
    code: '', name: '', lecturer: '', semester: '', color: PRESET_COLORS[0],
  })
  const [errors, setErrors] = useState<Partial<CourseFormData>>({})

  useEffect(() => {
    if (editingCourse) {
      setForm({
        code: editingCourse.code,
        name: editingCourse.name,
        lecturer: editingCourse.lecturer ?? '',
        semester: editingCourse.semester ?? '',
        color: editingCourse.color,
      })
    } else {
      setForm({ code: '', name: '', lecturer: '', semester: '', color: PRESET_COLORS[0] })
    }
    setErrors({})
  }, [editingCourse, open])

  const validate = () => {
    const e: Partial<CourseFormData> = {}
    if (!form.code.trim()) e.code = 'Course code is required'
    if (!form.name.trim()) e.name = 'Course name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onSubmit(form)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Edit Course' : 'Add Course'} maxWidth="max-w-md">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Course Code"
            placeholder="e.g., CS101"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            error={errors.code}
          />
          <Input
            label="Course Name"
            placeholder="e.g., Intro to Programming"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
          />
        </div>
        <Input
          label="Lecturer Name (Optional)"
          placeholder="e.g., Dr. Smith"
          value={form.lecturer}
          onChange={(e) => setForm({ ...form, lecturer: e.target.value })}
        />
        <Input
          label="Semester (Optional)"
          placeholder="e.g., Fall 2026"
          value={form.semester}
          onChange={(e) => setForm({ ...form, semester: e.target.value })}
        />

        {/* Color picker */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-2">Course Color (Optional)</label>
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                className={`w-7 h-7 rounded-full transition-all ${form.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-110'}`}
                style={{ backgroundColor: color }}
                onClick={() => setForm({ ...form, color })}
                type="button"
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>
            {isEditing ? 'Save Changes' : 'Save Course'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
