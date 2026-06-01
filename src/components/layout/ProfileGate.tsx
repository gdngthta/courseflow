'use client'

import { useAuthUser } from '@/contexts/AuthContext'
import { AlertTriangle } from 'lucide-react'

/**
 * Renders a full-page error if AuthContext could not guarantee a
 * profile row for the current user. Otherwise renders children.
 *
 * This is the user-visible fallback for ensureProfile() failures —
 * better than letting them hit foreign-key violations on every
 * task/course/project insert with cryptic Supabase error messages.
 */
export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { user, loading, profileError } = useAuthUser()

  if (!loading && user && profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-slate-950">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800/50 rounded-xl p-6">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Profile setup incomplete
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Your account is missing its CourseFlow profile row, so the app can&apos;t
                create or load your data. This usually means the database setup is
                incomplete.
              </p>
            </div>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 mt-3 mb-4">
            <p className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all">
              {profileError}
            </p>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold">Fix:</span> open the Supabase SQL Editor and run{' '}
            <code className="text-indigo-600 dark:text-indigo-400 font-mono">supabase/phase5.sql</code>{' '}
            from this repo, then refresh.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
