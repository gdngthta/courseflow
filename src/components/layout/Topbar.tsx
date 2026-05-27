'use client'

import { Search, Sun, Bell } from 'lucide-react'

interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  return (
    <header className="fixed top-0 left-60 right-0 h-16 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800 z-20">
      <h1 className="text-base font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Search — disabled until Phase 4 */}
        <div
          className="relative hidden sm:flex items-center"
          title="Search coming in a future update"
        >
          <Search size={14} className="absolute left-3 text-slate-600 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks, projects..."
            disabled
            className="pl-9 pr-4 py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-500 placeholder:text-slate-600 w-56 cursor-not-allowed opacity-60 select-none"
          />
        </div>

        {/* Theme toggle — coming soon */}
        <button
          disabled
          title="Theme switching coming in a future update"
          className="p-2 rounded-lg text-slate-600 cursor-not-allowed opacity-50"
        >
          <Sun size={17} />
        </button>

        {/* Notifications — coming soon */}
        <button
          disabled
          title="Notifications coming in a future update"
          className="p-2 rounded-lg text-slate-600 cursor-not-allowed opacity-50"
        >
          <Bell size={17} />
        </button>
      </div>
    </header>
  )
}
