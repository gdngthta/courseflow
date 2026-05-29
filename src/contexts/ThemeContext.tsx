'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  /** The setting the user picked (what we persist). */
  theme: Theme
  /** The currently-applied theme after resolving 'system'. */
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  /** Toggle between light and dark (collapses 'system' to its current resolved value first). */
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'courseflow:theme'

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  } catch {
    /* ignore */
  }
  return 'dark' // existing users keep dark by default
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
}

function applyTheme(resolved: 'light' | 'dark') {
  const html = document.documentElement
  if (resolved === 'dark') html.classList.add('dark')
  else html.classList.remove('dark')
}

/**
 * Theme provider. Reads stored preference on mount, applies it,
 * and re-applies whenever the user changes it or (when in 'system'
 * mode) the OS preference flips.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')

  // Initial read + apply
  useEffect(() => {
    const stored = readStoredTheme()
    setThemeState(stored)
  }, [])

  // Apply whenever theme changes
  useEffect(() => {
    const resolved: 'light' | 'dark' = theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme
    setResolvedTheme(resolved)
    applyTheme(resolved)
  }, [theme])

  // Watch system preference when in 'system' mode
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const resolved: 'light' | 'dark' = mq.matches ? 'dark' : 'light'
      setResolvedTheme(resolved)
      applyTheme(resolved)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {
      /* ignore quota errors */
    }
  }, [])

  const toggle = useCallback(() => {
    // From 'system' we collapse to the explicit opposite of what's currently showing.
    const next: Theme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }, [resolvedTheme, setTheme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
