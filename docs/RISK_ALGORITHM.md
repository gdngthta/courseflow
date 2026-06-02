# CourseFlow — Risk Algorithm

## Purpose

The risk algorithm automatically calculates a risk status for every task. This helps students quickly identify what needs urgent attention without manually reviewing every task.

## Risk Statuses

| Status | Color | Meaning |
|---|---|---|
| `completed` | Gray | Task is done |
| `critical` | Red | Urgent — needs immediate attention |
| `warning` | Amber | Approaching risk — should start soon |
| `safe` | Green | On track |

## Rules (applied in order)

```
IF status == 'done'
  → completed

IF due_date < today (overdue and not done)
  → critical

IF days_until_due <= 1 AND progress < 80%
  → critical

IF days_until_due <= 3 AND progress < 50%
  → critical

IF days_until_due <= 7 AND progress < 50%
  → warning

IF difficulty == 5 AND progress < 30%
  → warning

OTHERWISE
  → safe
```

### How difficulty affects risk

Difficulty (1–5) does not by itself promote a task to critical, but it
makes earlier rules more aggressive in two ways:

1. **Difficulty 5 with low progress** is automatically `warning` even
   if the deadline is comfortably far out — high-difficulty tasks
   need lead time to ramp up.
2. **Difficulty 4–5** is included in the Dashboard's "Today's
   Priority" rollup when the task is due within 7 days, regardless
   of risk class, so it surfaces sooner than a low-difficulty task
   with the same deadline.

UI helper text on TaskFormModal / AddProjectTaskModal mirrors this:
*"Difficulty increases risk when progress is low and the deadline is close."*

### How progress is computed

- **Task progress**: if the task has a checklist, progress is
  derived = completed items ÷ total items × 100, and persisted to
  Supabase whenever a checklist item is toggled. Manual progress
  slider only applies when there is no checklist.
- **Project progress**: completed project tasks ÷ total project
  tasks × 100. Recomputed on every render; never stored.

## Implementation

Located at `src/lib/risk.ts`.

```typescript
export function calculateRisk({ status, due_date, progress, difficulty }): RiskStatus
```

This function is used consistently across:
- Dashboard (Today's Priority, Critical Risk cards)
- My Tasks (task card badges)
- Project Detail (task card badges)

## Project Risk

Project risk is derived from the risk of its tasks:
- All done → `completed`
- Any task is `critical` → `critical`
- Any task is `warning` → `warning`
- Otherwise → `safe`

## Notes

- Risk is computed client-side on every render — no stored risk column in the database
- This keeps risk always up-to-date without stale data issues
- `due_date` is compared against the user's local time (new Date())
