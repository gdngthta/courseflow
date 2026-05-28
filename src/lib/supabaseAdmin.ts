import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Returns a Supabase client authenticated with the service role key.
 *
 * BYPASSES Row Level Security — use ONLY in server-side code
 * (API routes, server actions) where we need cross-user access,
 * such as the cron job that reads every user's reminder preferences
 * and writes to reminder_logs.
 *
 * The `import 'server-only'` guard above makes Next.js throw a
 * build-time error if this file is ever imported from a client
 * component or browser bundle.
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      '[CourseFlow] Missing server env vars.\n' +
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.\n' +
      'See .env.example for details.'
    )
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
