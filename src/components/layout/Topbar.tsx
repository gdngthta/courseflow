'use client'

import { GlobalSearch } from '@/components/layout/GlobalSearch'
import { NotificationsPanel } from '@/components/layout/NotificationsPanel'

interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  return (
    <header className="fixed top-0 left-60 right-0 h-16 flex items-center justify-between px-6 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800 z-20">
      <h1 className="text-base font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-3">
        <GlobalSearch />
        <NotificationsPanel />
      </div>
    </header>
  )
}
