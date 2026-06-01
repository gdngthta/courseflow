import {
  Sparkles,
  Users,
  AlertTriangle,
  Calendar,
  BookOpen,
  Shield,
  Send,
  Bell,
} from 'lucide-react'

interface Feature {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  body: string
}

const FEATURES: Feature[] = [
  {
    icon: Sparkles,
    title: 'Today\'s priority',
    body: 'See what actually needs attention today — overdue, critical, and due-now items surface to the top of every page.',
  },
  {
    icon: Users,
    title: 'Group tasks flow to you',
    body: 'When a project leader assigns you a task, it appears in your My Tasks automatically. No duplicate records, no syncing.',
  },
  {
    icon: AlertTriangle,
    title: 'Risk-aware deadlines',
    body: 'Each task is scored as Safe, Warning, or Critical based on time left, progress, and difficulty — so close calls don\'t go quiet.',
  },
  {
    icon: Calendar,
    title: 'Calendar deadline view',
    body: 'Personal tasks, group tasks, and project deadlines on one monthly grid. Filter by type, jump to any date.',
  },
  {
    icon: BookOpen,
    title: 'Organised by course',
    body: 'Every task belongs to a course. Filters and dropdowns let you focus on one class at a time.',
  },
  {
    icon: Shield,
    title: 'Role-aware projects',
    body: 'Leader, admin, and member roles control who can edit, assign, and complete project work. Completed projects become read-only history.',
  },
  {
    icon: Send,
    title: 'Telegram assistant',
    body: 'Message the bot from any chat to ask /critical, /today, /upcoming, /closest, or /projects — get live answers from your real data.',
  },
  {
    icon: Bell,
    title: 'Scheduled reminders',
    body: 'A daily check sends Telegram reminders for around-the-corner deadlines and high-risk tasks. Dedupe built in.',
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="py-20 bg-slate-50/60 dark:bg-slate-950/40 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">
            Why CourseFlow
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Everything a student needs to stop missing deadlines.
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            Built around how coursework actually works at university — personal study, group projects,
            and the constant tension between the two.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center mb-3">
                <f.icon size={16} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5">{f.title}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
