interface ProgressBarProps {
  value: number
  className?: string
  showLabel?: boolean
}

export function ProgressBar({ value, className = '', showLabel = false }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  const barColor =
    clamped >= 80 ? 'bg-green-500' :
    clamped >= 50 ? 'bg-indigo-500' :
    clamped >= 25 ? 'bg-amber-500' :
    'bg-red-500'

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums w-8 text-right">{clamped}%</span>
      )}
    </div>
  )
}
