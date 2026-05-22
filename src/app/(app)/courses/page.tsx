import { Topbar } from '@/components/layout/Topbar'

export default function CoursesPage() {
  return (
    <>
      <Topbar title="Courses" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">My Courses</h2>
            <p className="text-sm text-slate-400 mt-0.5">Manage the courses you are taking this semester.</p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
            + Add Course
          </button>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
          <p className="text-slate-400 text-sm">Course management coming in Phase 2.</p>
          <p className="text-slate-600 text-xs mt-1">This page will show your active courses with task counts and deadlines.</p>
        </div>
      </div>
    </>
  )
}
