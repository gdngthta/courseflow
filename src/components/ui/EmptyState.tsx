import { OwlMascot } from '@/components/brand/OwlMascot'

interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  showOwl?: boolean
  owlVariant?: 'default' | 'reading' | 'thinking'
}

export function EmptyState({
  title,
  description,
  action,
  showOwl = true,
  owlVariant = 'default',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {showOwl && (
        <div className="mb-5 opacity-80">
          <OwlMascot size={72} variant={owlVariant} />
        </div>
      )}
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {description && (
        <p className="mt-1.5 text-xs text-slate-500 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// Pre-built empty states for common pages

export function NoTasksEmpty({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      owlVariant="reading"
      title="No tasks yet"
      description="Add your first personal task to start tracking your coursework."
      action={
        onAdd && (
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + New Personal Task
          </button>
        )
      }
    />
  )
}

export function NoProjectsEmpty({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      owlVariant="default"
      title="No projects yet"
      description="Create your first group project workspace to start collaborating."
      action={
        onAdd && (
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Create Project
          </button>
        )
      }
    />
  )
}

export function NoCriticalEmpty() {
  return (
    <EmptyState
      owlVariant="thinking"
      title="No critical tasks"
      description="You're on track. The owl is watching your deadlines."
      showOwl={true}
    />
  )
}

export function NoCoursesEmpty({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      owlVariant="reading"
      title="No courses added"
      description="Add your enrolled courses to start organizing your tasks and projects."
      action={
        onAdd && (
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Add Course
          </button>
        )
      }
    />
  )
}

export function NoArchivedCoursesEmpty() {
  return (
    <EmptyState
      owlVariant="thinking"
      title="No archived courses"
      description="Courses you archive will appear here. Active courses are still visible in the Active tab."
    />
  )
}

export function NoCompletedProjectsEmpty() {
  return (
    <EmptyState
      owlVariant="thinking"
      title="No completed projects yet"
      description="Projects you mark as completed will appear here for reference."
    />
  )
}
