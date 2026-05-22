// Supabase client — not connected yet (Phase 0)
// Will be replaced with @supabase/supabase-js createClient() in Phase 1

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Placeholder — Phase 1 will install @supabase/supabase-js and replace this
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = null
