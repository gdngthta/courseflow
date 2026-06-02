'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { OwlMascot } from '@/components/brand/OwlMascot'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { validateEmailInput, validatePasswordInput } = await import('@/lib/validators')
    const emailErr = validateEmailInput(email)
    if (emailErr) { setError(emailErr); return }
    const pwErr = validatePasswordInput(password)
    if (pwErr) { setError(pwErr); return }

    setError('')
    setLoading(true)

    // Import lazily so createClient() is never called during SSR/prerender
    const { createClient } = await import('@/lib/supabase')
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(next)
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <OwlMascot size={88} variant="reading" className="opacity-90" />
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">CourseFlow</h1>
            <p className="text-xs text-slate-500 mt-0.5">Your academic productivity companion</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Sign in</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Welcome back. Sign in to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 dark:text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-5">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
