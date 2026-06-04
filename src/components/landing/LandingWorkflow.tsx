import { Circle, Clock, Eye, CheckCircle2 } from 'lucide-react'

interface Stage {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  tint: string
  body: string
  planned?: boolean
}

const STAGES: Stage[] = [
  {
    icon: Circle,
    label: 'Not Started',
    tint: 'text-slate-500',
    body: 'New task, ready to pick up. 0% progress.',
  },
  {
    icon: Clock,
    label: 'In Progress',
    tint: 'text-indigo-500',
    body: 'Actively being worked on. Progress slider tracks completion 0–100%.',
  },
  {
    icon: Eye,
    label: 'Review',
    tint: 'text-amber-500',
    body: 'Ready for review by the project leader or admin.',
    planned: true,
  },
  {
    icon: CheckCircle2,
    label: 'Done',
    tint: 'text-emerald-500',
    body: 'Marked complete. Hidden from the active calendar and dashboards.',
  },
]

export function LandingWorkflow() {
  return (
    <section id="workflow" className="py-20 bg-slate-50/60 dark:bg-slate-950/40 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">
            Workflow visibility
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
            See where every task stands.
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            Tasks move through clear stages. Progress and risk update everywhere they appear —
            My Tasks, project pages, dashboard, calendar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAGES.map((s, i) => (
            <div
              key={s.label}
              className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <s.icon size={18} className={s.tint} />
                <span className="text-[10px] font-semibold text-slate-400">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.label}</p>
                {s.planned && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                    Coming with Kanban
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-slate-500 dark:text-slate-400 italic max-w-xl">
          Note: the MVP today ships with three task states (Not Started, In Progress, Done).
          A drag-and-drop Kanban board with the Review stage is on the near-term roadmap.
        </p>
      </div>
    </section>
  )
}
