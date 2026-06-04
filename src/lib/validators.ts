/**
 * Shared input validators for auth + profile flows so the rules
 * are consistent across Signup, Login, and Settings → Profile.
 *
 * Returns the error message on failure or null on success.
 */

// Unicode-aware: allows letters from any script (A-Z, é, ü, ñ, Nguyễn, 马, etc.)
// so Southeast Asian and international names are accepted.
const NAME_RE = /^[\p{L}][\p{L}\s'\-]*$/u

/**
 * Allowed in names:
 *   - Unicode letters from any script (must start with one)
 *   - spaces
 *   - apostrophes (e.g. O'Brien)
 *   - hyphens (e.g. Anne-Marie)
 *
 * Rejected: digits, underscores, symbols, emoji, empty / whitespace-only.
 */
export function validateNameInput(raw: string): string | null {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return 'Full name is required.'
  if (!NAME_RE.test(trimmed)) {
    return "Name can only contain letters, spaces, apostrophes, and hyphens."
  }
  return null
}

/**
 * Password rules:
 *   - minimum 6 characters (Supabase default)
 *   - no whitespace anywhere (avoids invisible-character footguns
 *     where users accidentally pasted leading/trailing spaces or
 *     try to use a passphrase that won't match between Login and Signup)
 */
export function validatePasswordInput(password: string): string | null {
  if (!password) return 'Password is required.'
  if (password.length < 6) return 'Password must be at least 6 characters.'
  if (/\s/.test(password)) return 'Password cannot contain spaces.'
  return null
}

/**
 * Minimal email check. Supabase does the authoritative validation
 * on its side; this catches obvious typos before a round-trip.
 */
export function validateEmailInput(email: string): string | null {
  const trimmed = (email ?? '').trim()
  if (!trimmed) return 'Email is required.'
  if (!trimmed.includes('@') || !trimmed.includes('.')) {
    return 'Please enter a valid email address.'
  }
  return null
}
