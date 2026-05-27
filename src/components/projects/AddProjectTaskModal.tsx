'use client'

import { useState } from 'react'
import { X, Square } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SelectInput } from '@/components/ui/SelectInput'
import type { Difficulty, TaskLink, TaskChecklistItem } from '@/types'

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
  links: TaskLink[]
  checklist: TaskChecklistItem[]
}

const DIFFICULTY_OPTIONS = [
  { value: '1', label: '1 — Very Easy' },
  { value: '2', label: '2 — Easy' },
  { value: '3', label: '3 — Medium' },
  { value: '4', label: '4 — Hard' },
  { value: '5', label: '5 — Very Hard' },
]

const EMPTY_FORM: AddProjectTaskData = {
  title: '', assigned_to: '', due_date: '', difficulty: 3, notes: '', links: [], checklist: [],
}

export function AddProjectTaskModal({ open, onClose, onSubmit, members }: AddProjectTaskModalProps) {
  const [form, setForm] = useState<AddProjectTaskData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<'title' | 'due_date' | 'links', string>>>({})

  const memberOptions = members.map((m) => ({ value: m.id, label: m.name }))

  // ── Link helpers ──
  const addLink = () => setForm((f) => ({ ...f, links: [...f.links, { label: '', url: '' }] }))
  const updateLink = (i: number, field: keyof TaskLink, val: string) =>
    setForm((f) => ({ ...f, links: f.links.map((l, idx) => idx === i ? { ...l, [field]: val } : l) }))
  const removeLink = (i: number) =>
    setForm((f) => ({ ...f, links: f.links.filter((_, idx) => idx !== i) }))

  // ── Checklist helpers ──
  const addChecklistItem = () =>
    setForm((f) => ({ ...f, checklist: [...f.checklist, { id: `item-${Date.now()}`, text: '', done: false }] }))
  const updateChecklistItem = (i: number, text: string) =>
    setForm((f) => ({ ...f, checklist: f.checklist.map((item, idx) => idx === i ? { ...item, text } : item) }))
  const removeChecklistItem = (i: number) =>
    setForm((f) => ({ ...f, checklist: f.checklist.filter((_, idx) => idx !== i) }))

  const validate = () => {
    const e: typeof errors = {}
    if (!form.title.trim()) e.title = 'Task title is required'
    if (!form.due_date) e.due_date = 'Due date is required'
    const badLink = form.links.find(
      (l) => l.url.trim() && !l.url.trim().match(/^https?:\/\/.+/)
    )
    if (badLink) e.links = `Invalid URL "${badLink.url}" — must start with http:// or https://`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onSubmit(form)
    setForm(EMPTY_FORM)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Project Task" maxWidth="max-w-lg">
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
          placeholder="Select a member..."
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

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-300">Instructions / Notes <span className="text-slate-500">(Optional)</span></label>
          <textarea
            rows={3}
            placeholder="Add instructions or context for the assigned member..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:border-indigo-500 focus:ring-indigo-500 transition resize-none"
          />
        </div>

        {/* Resources */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">Resources <span className="text-slate-500">(Optional)</span></label>
            <button
              type="button"
              onClick={addLink}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              + Add
            </button>
          </div>
          {form.links.length > 0 ? (
            <div className="space-y-1.5">
              {form.links.map((link, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Label"
                    value={link.label}
                    onChange={(e) => { updateLink(i, 'label', e.target.value); setErrors((prev) => ({ ...prev, links: undefined })) }}
                    className="w-2/5 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <input
                    type="url"
                    placeholder="https://..."
                    value={link.url}
                    onChange={(e) => { updateLink(i, 'url', e.target.value); setErrors((prev) => ({ ...prev, links: undefined })) }}
                    className="flex-1 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(i)}
                    className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors flex-shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              {errors.links && (
                <p className="text-xs text-red-400">{errors.links}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-600 italic">No resources added.</p>
          )}
        </div>

        {/* Checklist */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">Checklist <span className="text-slate-500">(Optional)</span></label>
            <button
              type="button"
              onClick={addChecklistItem}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              + Add item
            </button>
          </div>
          {form.checklist.length > 0 ? (
            <div className="space-y-1.5">
              {form.checklist.map((item, i) => (
                <div key={item.id} className="flex items-center gap-1.5">
                  <Square size={13} className="text-slate-600 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Checklist item..."
                    value={item.text}
                    onChange={(e) => updateChecklistItem(i, e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(i)}
                    className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors flex-shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-600 italic">No items added.</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Add Task</Button>
        </div>
      </div>
    </Modal>
  )
}
