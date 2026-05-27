'use client'

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import type { User, SupabaseClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

type AppSupabaseClient = SupabaseClient

interface AuthContextValue {
  user: User | null
  /** True while the initial session check is still in flight */
  loading: boolean
  /** Signs the current user out and navigates to /login */
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Store the client in a ref so we can reach it from signOut without
  // re-running the effect. Using a ref also avoids the component body
  // calling createClient() during SSR/static-prerender.
  const supabaseRef = useRef<AppSupabaseClient | null>(null)

  useEffect(() => {
    // createClient() is only called here — inside useEffect — so it
    // never runs on the server during static pre-rendering.
    import('@/lib/supabase').then(({ createClient }) => {
      const supabase = createClient()
      supabaseRef.current = supabase

      // Get the initial session
      supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
        setUser(currentUser)
        setLoading(false)
      })

      // Keep user state in sync with Supabase auth events
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null)
        }
      )

      return () => subscription.unsubscribe()
    })
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
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Returns the current Supabase auth user, a loading flag, and a signOut helper. */
export function useAuthUser() {
  return useContext(AuthContext)
}
