import { calculateRisk } from '@/lib/risk'
import type {
  ReminderDaysBefore,
  ReminderPreferences,
  ReminderType,
  RiskStatus,
  TaskStatus,
  Difficulty,
} from '@/types'

// ── Candidate shape ──────────────────────────────────────────
//
// A reminder candidate is the smallest set of fields needed to
// (a) decide whether to send, (b) format the message, and
// (c) write a dedupe row. We deliberately keep this shape
// independent of the Supabase row types so it can be built
// from either a personal task or a project task.

export interface ReminderCandidate {
  task_id: string
  task_type: 'personal' | 'project'
  title: string
  status: TaskStatus
  progress: number
  difficulty: Difficulty
  due_date: string
  /** "CS101 — Intro to Computing" for personal tasks. */
  course_label?: string
  /** "Final Group Presentation" for project tasks. */
  project_name?: string
  /** The reason the cron picked this task. */
  reminder_type: ReminderType
}

// ── Date helpers ─────────────────────────────────────────────

/** Days from today to due_date, in whole days (negative = overdue). */
export function daysUntilDue(due_date: string, today: Date = new Date()): number {
  const due = new Date(due_date + 'T00:00:00')
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diffMs = due.getTime() - start.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

// ── Decision functions ──────────────────────────────────────
//
// These are pure: same input → same output, no Supabase, no fetch.
// Exported so they can be unit-tested independently of the cron.

/**
 * Should we send an "around-the-corner deadline" reminder for this
 * task, given the user's preferences and today's date?
 *
 * Triggers when the task is incomplete AND the days-until-due is
 * within the user's window (e.g., 1 day before → fires when due
 * date is today or tomorrow). Overdue tasks also qualify so the
 * user is nudged about them.
 */
export function shouldSendAroundDeadlineReminder(
  task: { status: TaskStatus; due_date: string },
  prefs: Pick<ReminderPreferences, 'around_deadline_enabled' | 'days_before'>,
  today: Date = new Date()
): boolean {
  if (!prefs.around_deadline_enabled) return false
  if (task.status === 'done') return false
  const days = daysUntilDue(task.due_date, today)
  return days <= prefs.days_before
}

/**
 * Should we send a "high risk" reminder for this task?
 *
 * Fires when the calculated risk is 'critical' and the user has
 * high-risk reminders enabled. 'warning' tasks are intentionally
 * NOT included — they'd be too noisy.
 */
export function shouldSendHighRiskReminder(
  task: { status: TaskStatus; due_date: string; progress: number; difficulty: number },
  prefs: Pick<ReminderPreferences, 'high_risk_enabled'>
): boolean {
  if (!prefs.high_risk_enabled) return false
  if (task.status === 'done') return false
  const risk = calculateRisk({
    status: task.status,
    due_date: task.due_date,
    progress: task.progress,
    difficulty: task.difficulty,
  })
  return risk === 'critical'
}

// ── Message generation ─────────────────────────────────────

function actionSentence(
  reminder_type: ReminderType,
  daysAway: number,
  risk: RiskStatus
): string {
  if (daysAway < 0) return 'This task is overdue. Handle it as soon as possible.'
  if (reminder_type === 'high_risk' || risk === 'critical') {
    if (daysAway === 0) return 'High risk task. Focus on this today.'
    return 'High risk task. Focus on this today.'
  }
  if (daysAway === 0) return 'Focus on this today.'
  if (daysAway === 1) return 'Prepare this before tomorrow.'
  return 'Deadline is around the corner. Finish the remaining checklist soon.'
}

function formatDueDate(due_date: string): string {
  return new Date(due_date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function riskLabel(risk: RiskStatus): string {
  return risk.charAt(0).toUpperCase() + risk.slice(1)
}

/**
 * Build the plain-text Telegram message for a reminder candidate.
 * Same format for personal vs project tasks, swapping "Course:" for
 * "Project:" on the second line.
 */
export function generateReminderMessage(c: ReminderCandidate, today: Date = new Date()): string {
  const days = daysUntilDue(c.due_date, today)
  const risk = calculateRisk({
    status: c.status,
    due_date: c.due_date,
    progress: c.progress,
    difficulty: c.difficulty,
  })

  const contextLine =
    c.task_type === 'personal'
      ? `Course: ${c.course_label ?? 'No course'}`
      : `Project: ${c.project_name ?? 'Untitled project'}`

  return [
    '🦉 CourseFlow Reminder',
    '',
    `Task: ${c.title}`,
    contextLine,
    `Due: ${formatDueDate(c.due_date)}`,
    `Risk: ${riskLabel(risk)}`,
    `Progress: ${c.progress}%`,
    '',
    actionSentence(c.reminder_type, days, risk),
  ].join('\n')
}

// ── Candidate finder ───────────────────────────────────────
//
// Given a user's preferences and a flat list of tasks, return
// every (task × reminder_type) pair that qualifies for a send.
//
// A single task can produce up to two candidates (one for each
// reminder_type) — but the cron job's dedupe check will collapse
// them in practice if both fire on the same day.

export interface CandidateTaskInput {
  task_id: string
  task_type: 'personal' | 'project'
  title: string
  status: TaskStatus
  progress: number
  difficulty: Difficulty
  due_date: string
  course_label?: string
  project_name?: string
}

export function findReminderCandidates(
  tasks: CandidateTaskInput[],
  prefs: ReminderPreferences,
  today: Date = new Date()
): ReminderCandidate[] {
  if (!prefs.enabled) return []

  const out: ReminderCandidate[] = []
  for (const t of tasks) {
    if (shouldSendAroundDeadlineReminder(t, prefs, today)) {
      out.push({ ...t, reminder_type: 'around_deadline' })
    }
    if (shouldSendHighRiskReminder(t, prefs)) {
      out.push({ ...t, reminder_type: 'high_risk' })
    }
  }
  return out
}
