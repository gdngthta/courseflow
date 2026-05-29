'use client'

import { Sun, Moon } from 'lucide-react'
import { GlobalSearch } from '@/components/layout/GlobalSearch'
import { NotificationsPanel } from '@/components/layout/NotificationsPanel'
import { useTheme } from '@/contexts/ThemeContext'

interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  const { resolvedTheme, toggle } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <header className="fixed top-0 left-60 right-0 h-16 flex items-center justify-between px-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 z-20">
      <h1 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h1>

      <div className="flex items-center gap-3">
        <GlobalSearch />

        <button
          onClick={toggle}
          title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-slate-800 transition-colors"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <NotificationsPanel />
      </div>
    </header>
  )
}
