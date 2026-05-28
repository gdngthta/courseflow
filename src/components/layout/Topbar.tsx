'use client'

import { Sun, Bell } from 'lucide-react'
import { GlobalSearch } from '@/components/layout/GlobalSearch'

interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  return (
    <header className="fixed top-0 left-60 right-0 h-16 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800 z-20">
      <h1 className="text-base font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-3">
        <GlobalSearch />

        {/* Theme toggle — wired up in Phase 5A sub-commit #3 */}
        <button
          disabled
          title="Theme switching coming in a future update"
          className="p-2 rounded-lg text-slate-600 cursor-not-allowed opacity-50"
        >
          <Sun size={17} />
        </button>

        {/* Notifications — wired up in Phase 5A sub-commit #2 */}
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
