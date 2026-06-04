/**
 * Parse a YYYY-MM-DD date string anchored to local midnight so that
 * "today" is computed correctly in any timezone (avoids the UTC-midnight
 * offset bug where `new Date('2026-06-04')` is actually 2026-06-03 23:xx
 * in UTC+8 browsers).
 *
 * Use this everywhere a due_date string needs to become a Date object.
 */
export function parseDueDate(dateStr: string): Date {
  // Appending 'T00:00:00' makes the JS engine parse as local time, not UTC.
  return new Date(dateStr + 'T00:00:00')
}

export function formatDueDate(dateStr: string): string {
  const due = parseDueDate(dateStr)
  const now = new Date()

  // Normalise to midnight for day comparison
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diff < 0) return `${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'} ago`
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff <= 7) return `In ${diff} days`

  return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatFullDate(dateStr: string): string {
  return parseDueDate(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function daysUntilDue(dateStr: string): number {
  const due = parseDueDate(dateStr)
  const now = new Date()
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
