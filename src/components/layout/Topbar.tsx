'use client'

import { Menu } from 'lucide-react'
import { GlobalSearch } from '@/components/layout/GlobalSearch'
import { NotificationsPanel } from '@/components/layout/NotificationsPanel'
import { useMobileSidebar } from '@/contexts/MobileSidebarContext'

interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  const { toggle } = useMobileSidebar()

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-60 h-16 flex items-center justify-between px-4 sm:px-6 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800 z-20">
      {/* Left: hamburger (mobile) + title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggle}
          className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-base font-semibold text-white truncate">{title}</h1>
      </div>

      {/* Right: search + bell */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <GlobalSearch />
        <NotificationsPanel />
      </div>
    </header>
  )
}
