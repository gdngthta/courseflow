import type { Difficulty } from '@/types'

const labels: Record<Difficulty, string> = {
  1: 'Very Easy',
  2: 'Easy',
  3: 'Medium',
  4: 'Hard',
  5: 'Very Hard',
}

interface DifficultyIndicatorProps {
  level: Difficulty
  showLabel?: boolean
}

export function DifficultyIndicator({ level, showLabel = false }: DifficultyIndicatorProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex gap-0.5">
        {([1, 2, 3, 4, 5] as Difficulty[]).map((i) => (
          <span
            key={i}
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              i <= level ? 'bg-indigo-400' : 'bg-slate-700'
            }`}
          />
        ))}
      </span>
      {showLabel && (
        <span className="text-xs text-slate-400">{labels[level]}</span>
      )}
    </span>
  )
}
