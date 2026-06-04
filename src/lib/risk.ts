import type { RiskStatus, TaskStatus } from '@/types'
import { parseDueDate } from '@/lib/utils'

interface RiskInput {
  status: TaskStatus
  due_date: string
  progress: number
  difficulty: number
}

export function calculateRisk({ status, due_date, progress, difficulty }: RiskInput): RiskStatus {
  if (status === 'done') return 'completed'

  // Use parseDueDate (local midnight) so "today" is correct in UTC+8 and
  // other non-UTC timezones — fixes off-by-one risk calculations.
  const now = new Date()
  const due = parseDueDate(due_date)
  const daysUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

  if (daysUntilDue < 0) return 'critical'
  if (daysUntilDue <= 1 && progress < 80) return 'critical'
  if (daysUntilDue <= 3 && progress < 50) return 'critical'
  if (daysUntilDue <= 7 && progress < 50) return 'warning'
  if (difficulty === 5 && progress < 30) return 'warning'

  return 'safe'
}

export function calculateProjectRisk(tasks: { status: string; due_date: string; progress: number; difficulty: number }[]): RiskStatus {
  if (tasks.length === 0) return 'safe'
  const allDone = tasks.every((t) => t.status === 'done')
  if (allDone) return 'completed'

  const hasCritical = tasks.some((t) =>
    calculateRisk({ status: t.status as TaskStatus, due_date: t.due_date, progress: t.progress, difficulty: t.difficulty }) === 'critical'
  )
  if (hasCritical) return 'critical'

  const hasWarning = tasks.some((t) =>
    calculateRisk({ status: t.status as TaskStatus, due_date: t.due_date, progress: t.progress, difficulty: t.difficulty }) === 'warning'
  )
  if (hasWarning) return 'warning'

  return 'safe'
}
