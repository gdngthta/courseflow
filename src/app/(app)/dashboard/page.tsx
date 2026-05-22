import { Topbar } from '@/components/layout/Topbar'

export default function DashboardPage() {
  return (
    <>
      <Topbar title="Dashboard" />
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">Good morning, Gading 👋</h2>
          <p className="text-sm text-slate-400 mt-0.5">Here&apos;s what&apos;s happening with your coursework today.</p>
        </div>

        {/* Summary cards placeholder */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Today's Tasks", value: '—', sub: '—' },
            { label: 'Critical Tasks', value: '—', sub: 'Needs attention' },
            { label: 'Active Projects', value: '—', sub: '—' },
            { label: 'Active Courses', value: '—', sub: '—' },
          ].map((card) => (
            <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400">{card.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
          <p className="text-slate-400 text-sm">Dashboard content coming in Phase 1.</p>
          <p className="text-slate-600 text-xs mt-1">This page will show Today&apos;s Priority, Critical Risk, Upcoming Deadlines, and Course Overview.</p>
        </div>
      </div>
    </>
  )
}
