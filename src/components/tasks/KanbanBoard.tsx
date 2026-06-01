'use client'

import { useMemo, useState, useCallback } from 'react'
import { useData } from '@/contexts/DataContext'
import type { TaskCardData, TaskStatus, TaskChecklistItem } from '@/types'
import { KanbanCard } from '@/components/tasks/KanbanCard'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'

interface KanbanBoardProps {
  /** Filtered task list from the parent — already respects tab + course filter. */
  tasks: TaskCardData[]
  /**
   * Set of task ids that should be rendered read-only (e.g. tasks under a
   * completed project). The card hides drag handles + status dropdown for
   * these.
   */
  readOnlyIds: Set<string>
}

interface Column {
  id: TaskStatus
  label: string
  /** Tailwind classes for the column header strip. */
  accent: string
}

const COLUMNS: Column[] = [
  { id: 'not_started', label: 'Not Started', accent: 'bg-slate-400 dark:bg-slate-500' },
  { id: 'in_progress', label: 'In Progress', accent: 'bg-indigo-500' },
  { id: 'review',      label: 'Review',      accent: 'bg-amber-500' },
  { id: 'done',        label: 'Done',        accent: 'bg-emerald-500' },
]

/**
 * Kanban board for My Tasks. Renders the same combined task list (personal
 * + assigned project tasks) as the list view, just bucketed by status.
 *
 * Status changes:
 *   - HTML5 native drag-and-drop on desktop (no library; zero new deps).
 *   - Status dropdown on each card as a touch-friendly fallback.
 *
 * Either path routes through the same handler, which dispatches to either
 * updatePersonalTaskStatus or updateProjectTask depending on task.type.
 * Both helpers are optimistic + persist to Supabase + refetch on error.
 */
export function KanbanBoard({ tasks, readOnlyIds }: KanbanBoardProps) {
  const {
    personalTasks,
    updatePersonalTaskStatus,
    updateProjectTask,
    updatePersonalTaskChecklist,
    updateProjectTaskChecklist,
  } = useData()

  const [selectedTask, setSelectedTask] = useState<TaskCardData | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)

  // Bucket tasks by status. Computed fresh on every render — cheap O(n).
  const tasksByColumn = useMemo(() => {
    const buckets: Record<TaskStatus, TaskCardData[]> = {
      not_started: [],
      in_progress: [],
      review: [],
      done: [],
    }
    for (const t of tasks) buckets[t.status].push(t)
    // Sort each column by due date ascending so the most urgent items
    // surface at the top of every column.
    for (const k of Object.keys(buckets) as TaskStatus[]) {
      buckets[k].sort((a, b) => a.due_date.localeCompare(b.due_date))
    }
    return buckets
  }, [tasks])

  const moveTask = useCallback(
    async (task: TaskCardData, newStatus: TaskStatus) => {
      if (task.status === newStatus) return
      if (readOnlyIds.has(task.id)) return

      if (task.type === 'personal') {
        await updatePersonalTaskStatus(task.id, newStatus)
      } else {
        // Project tasks: also stamp progress=100 on done, mirroring
        // markProjectTaskDone semantics.
        await updateProjectTask(task.id, {
          status: newStatus,
          ...(newStatus === 'done' ? { progress: 100 } : {}),
        })
      }
    },
    [readOnlyIds, updatePersonalTaskStatus, updateProjectTask]
  )

  const handleChecklistUpdate = (taskId: string, checklist: TaskChecklistItem[]) => {
    const isPersonal = personalTasks.some((t) => t.id === taskId)
    if (isPersonal) updatePersonalTaskChecklist(taskId, checklist)
    else updateProjectTaskChecklist(taskId, checklist)
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory md:snap-none">
        {COLUMNS.map((col) => {
          const items = tasksByColumn[col.id]
          const isOver = dragOverColumn === col.id

          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault()
                if (dragOverColumn !== col.id) setDragOverColumn(col.id)
              }}
              onDragLeave={(e) => {
                // Only clear the over-state if the leave is to outside the column,
                // not just from one inner child to another.
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverColumn((prev) => (prev === col.id ? null : prev))
                }
              }}
              onDrop={(e) => {
                e.preventDefault()
                setDragOverColumn(null)
                setDraggingId(null)
                const id = e.dataTransfer.getData('text/plain')
                if (!id) return
                const task = tasks.find((t) => t.id === id)
                if (!task) return
                moveTask(task, col.id)
              }}
              className={`flex-shrink-0 w-72 snap-start flex flex-col rounded-xl border transition-colors ${
                isOver
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Column header */}
              <div className="px-3 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.accent}`} />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  {col.label}
                </p>
                <span className="ml-auto text-xs text-slate-500">{items.length}</span>
              </div>

              {/* Column body */}
              <div className="flex-1 p-2.5 space-y-2 min-h-[8rem]">
                {items.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-6">No tasks here.</p>
                ) : (
                  items.map((t) => (
                    <KanbanCard
                      key={t.id}
                      task={t}
                      readOnly={readOnlyIds.has(t.id)}
                      isDragging={draggingId === t.id}
                      onDragStart={() => setDraggingId(t.id)}
                      onDragEnd={() => {
                        setDraggingId(null)
                        setDragOverColumn(null)
                      }}
                      onOpen={() => setSelectedTask(t)}
                      onStatusChange={(newStatus) => moveTask(t, newStatus)}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onChecklistUpdate={handleChecklistUpdate}
      />
    </>
  )
}
