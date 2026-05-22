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
