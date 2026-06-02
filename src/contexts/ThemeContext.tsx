'use client'

import { createContext, useContext, useEffect } from 'react'

/**
 * Dark-only theme provider (Phase 5G).
 *
 * Earlier phases shipped a light/dark toggle backed by localStorage,
 * but light mode never reached an acceptable polish bar and was
 * creating UI debt. The toggle UI is removed and `dark` is always
 * applied to <html>. Existing `dark:` Tailwind variants throughout
 * the app keep working unchanged — light variants paired with them
 * simply never apply.
 *
 * The context is retained as a stub so any lingering `useTheme()`
 * call sites compile and behave sanely without us having to delete
 * dozens of imports.
 */

type Theme = 'dark'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: Theme
}

const VALUE: ThemeContextValue = { theme: 'dark', resolvedTheme: 'dark' }

const ThemeContext = createContext<ThemeContextValue>(VALUE)

const STORAGE_KEY = 'courseflow:theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always apply the dark class. Also wipe any stale localStorage
  // value left over from the light/dark toggle era so the inline
  // <head> init script can't be confused if we ever change minds.
  useEffect(() => {
    document.documentElement.classList.add('dark')
    document.documentElement.classList.remove('light')
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && stored !== 'dark') localStorage.setItem(STORAGE_KEY, 'dark')
    } catch {
      /* private mode / quota — irrelevant */
    }
  }, [])

  return <ThemeContext.Provider value={VALUE}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}

// Re-exported for legacy call sites that import the Theme type.
export type { Theme }
