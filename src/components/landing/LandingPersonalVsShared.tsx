import { User, Users, ArrowDown } from 'lucide-react'

/**
 * The product's key conceptual point: personal and group tasks
 * live in the same view but stay separate records — group tasks
 * are never duplicated into personal_tasks.
 */
export function LandingPersonalVsShared() {
  return (
    <section id="about" className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">
            Personal &amp; Shared, side by side
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Two kinds of work. One place to see them.
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            CourseFlow shows your personal study tasks and the group-project tasks assigned to you in a
            single list. They stay <em>separate records</em> in the database — assigned project tasks are
            never duplicated into your personal task table.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Personal */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center">
                <User size={16} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Personal tasks</p>
                <p className="text-xs text-slate-500">Owned by you. Linked to a course.</p>
              </div>
            </div>
            <ul className="space-y-2">
              <PreviewItem dot="bg-indigo-500" title="Read Chapter 4 &amp; 5" sub="WIA1005 · Tomorrow" />
              <PreviewItem dot="bg-red-500" title="Submit Lab 3" sub="WIA1005 · Today · Critical" />
              <PreviewItem dot="bg-indigo-500" title="Practice past papers" sub="WIA1006 · Fri" />
            </ul>
          </div>

          {/* Group */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/50 flex items-center justify-center">
                <Users size={16} className="text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Group tasks assigned to you</p>
                <p className="text-xs text-slate-500">Owned by the project. Visible because you&apos;re assigned.</p>
              </div>
            </div>
            <ul className="space-y-2">
              <PreviewItem dot="bg-violet-500" title="Database schema" sub="WIA2005 Group Project · 60%" />
              <PreviewItem dot="bg-violet-500" title="Build login API" sub="WIA2005 Group Project · 20%" />
              <PreviewItem dot="bg-emerald-500" title="Research peer comparisons" sub="Research Paper · Done" />
            </ul>
          </div>
        </div>

        {/* Arrow + combine line */}
        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <ArrowDown size={18} className="text-slate-400 dark:text-slate-600" />
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md">
            Both lists combine into a single <span className="font-semibold text-slate-900 dark:text-white">My Tasks</span> page —
            same risk scoring, same calendar, same dashboard rollups.
          </p>
        </div>
      </div>
    </section>
  )
}

function PreviewItem({ dot, title, sub }: { dot: string; title: string; sub: string }) {
  return (
    <li className="flex items-start gap-3 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
      <span className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900 dark:text-white truncate">{title}</p>
        <p className="text-xs text-slate-500 truncate">{sub}</p>
      </div>
    </li>
  )
}
