import { createBrowserClient } from '@supabase/ssr'

/**
 * Returns a Supabase browser client.
 * Safe to call in any client component — @supabase/ssr caches by URL+key internally.
 *
 * Throws a clear error if environment variables are missing so misconfiguration
 * is caught immediately in development rather than producing confusing auth failures.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      '[CourseFlow] Missing Supabase environment variables.\n' +
      'Copy .env.example → .env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.\n' +
      'See the README for setup instructions.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
