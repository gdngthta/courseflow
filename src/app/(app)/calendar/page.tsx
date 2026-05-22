import { Topbar } from '@/components/layout/Topbar'

export default function CalendarPage() {
  return (
    <>
      <Topbar title="Calendar" />
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">Calendar</h2>
          <p className="text-sm text-slate-400 mt-0.5">View your tasks and deadlines by date.</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
          <p className="text-slate-400 text-sm">Calendar view coming in a later phase.</p>
          <p className="text-slate-600 text-xs mt-1">This page will show a monthly calendar with tasks plotted by due date.</p>
        </div>
      </div>
    </>
  )
}
