'use client'

import { Pencil, Archive, CheckSquare, FolderKanban, Calendar } from 'lucide-react'
import { formatDueDate } from '@/lib/utils'
import type { Course } from '@/types'

interface CourseCardProps {
  course: Course
  taskCount: number
  projectCount: number
  nextDeadline?: string
  onEdit: (course: Course) => void
  onArchive: (course: Course) => void
}

export function CourseCard({ course, taskCount, projectCount, nextDeadline, onEdit, onArchive }: CourseCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
            style={{ backgroundColor: course.color }}
          />
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{course.code}</p>
            <h3 className="text-sm font-semibold text-white leading-snug">{course.name}</h3>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(course)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
            title="Edit course"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onArchive(course)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
            title="Archive course"
          >
            <Archive size={13} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <CheckSquare size={12} />
            <span className="text-xs">Active Tasks</span>
          </div>
          <p className="text-lg font-bold text-white">{taskCount}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <FolderKanban size={12} />
            <span className="text-xs">Projects</span>
          </div>
          <p className="text-lg font-bold text-white">{projectCount}</p>
        </div>
      </div>

      {/* Next deadline */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Calendar size={11} />
        <span>
          Next deadline:{' '}
          <span className="text-slate-200">
            {nextDeadline ? formatDueDate(nextDeadline) : 'None'}
          </span>
        </span>
      </div>
    </div>
  )
}
