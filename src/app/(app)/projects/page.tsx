import { Topbar } from '@/components/layout/Topbar'

export default function ProjectsPage() {
  return (
    <>
      <Topbar title="Projects" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Projects</h2>
            <p className="text-sm text-slate-400 mt-0.5">Shared workspaces for group assignments and projects.</p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
            + Create Project
          </button>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
          <p className="text-slate-400 text-sm">Project list coming in Phase 3.</p>
          <p className="text-slate-600 text-xs mt-1">This page will show all projects you belong to, with progress and risk status.</p>
        </div>
      </div>
    </>
  )
}
