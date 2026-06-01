'use client'

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import type { User, SupabaseClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

type AppSupabaseClient = SupabaseClient

interface AuthContextValue {
  user: User | null
  /**
   * True while the initial session check + profile-existence check are still in flight.
   * Stays true until BOTH the auth user is resolved AND a profiles row is confirmed,
   * which prevents downstream code (DataContext, task creation, etc.) from running
   * against a user_id that has no matching profile row.
   */
  loading: boolean
  /**
   * If non-null, the app could not guarantee a profile row for the current user
   * (e.g. RLS misconfiguration, network failure during ensureProfile). Surfaced to
   * the UI so the user is told why the app isn't loading instead of silently
   * letting them hit FK-violation errors on every task/course/project insert.
   */
  profileError: string | null
  /** Signs the current user out and navigates to /login */
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  profileError: null,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Store the client in a ref so we can reach it from signOut without
  // re-running the effect.
  const supabaseRef = useRef<AppSupabaseClient | null>(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      import('@/lib/supabase'),
      import('@/lib/api/profiles'),
    ]).then(([{ createClient }, { ensureProfile }]) => {
      const supabase = createClient()
      supabaseRef.current = supabase

      const bootstrap = async (currentUser: User | null) => {
        if (cancelled) return
        setUser(currentUser)
        if (!currentUser) {
          // Logged out — no profile to ensure.
          setProfileError(null)
          setLoading(false)
          return
        }
        try {
          await ensureProfile()
          if (cancelled) return
          setProfileError(null)
        } catch (err) {
          if (cancelled) return
          const msg = err instanceof Error ? err.message : 'Failed to load your profile.'
          setProfileError(msg)
          console.error('[AuthContext] ensureProfile failed', err)
        } finally {
          if (!cancelled) setLoading(false)
        }
      }

      supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
        bootstrap(currentUser)
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          // Re-run the bootstrap on auth change so a fresh sign-in
          // also guarantees a profile row before the app proceeds.
          bootstrap(session?.user ?? null)
        }
      )

      return () => {
        cancelled = true
        subscription.unsubscribe()
      }
    })

    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signOut = useCallback(async () => {
    const client = supabaseRef.current
    if (client) {
      await client.auth.signOut()
    }
    router.push('/login')
    router.refresh()
  }, [router])

  return (
    <AuthContext.Provider value={{ user, loading, profileError, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Returns the current Supabase auth user, a loading flag, and a signOut helper. */
export function useAuthUser() {
  return useContext(AuthContext)
}
