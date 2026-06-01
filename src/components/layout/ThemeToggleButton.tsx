'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

/**
 * Reusable Sun/Moon toggle button. Calls into ThemeContext so any
 * instance (topbar, landing navbar, etc.) flips the same shared
 * localStorage-backed preference.
 */
export function ThemeToggleButton({ className = '' }: { className?: string }) {
  const { resolvedTheme, toggle } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={
        'p-2 rounded-lg text-slate-500 dark:text-slate-400 ' +
        'hover:text-slate-900 dark:hover:text-slate-200 ' +
        'hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ' +
        className
      }
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}
