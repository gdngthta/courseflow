'use client'

import { useState } from 'react'
import { Camera, LogOut } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Input } from '@/components/ui/Input'
import { SelectInput } from '@/components/ui/SelectInput'
import { Button } from '@/components/ui/Button'
import { useAuthUser } from '@/contexts/AuthContext'
import { updateMyProfile } from '@/lib/api/profiles'
import { createClient } from '@/lib/supabase'

type Section = 'profile' | 'preferences' | 'account'

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'account', label: 'Account' },
]

const THEME_OPTIONS = [
  { value: 'system', label: 'System Default' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
]

export default function SettingsPage() {
  const { user, loading: authLoading, signOut } = useAuthUser()

  // Derive display name from Supabase user metadata
  const fullName: string = user?.user_metadata?.full_name ?? ''
  const nameParts = fullName.split(' ')
  const defaultFirst = nameParts[0] ?? ''
  const defaultLast = nameParts.slice(1).join(' ') ?? ''

  const [activeSection, setActiveSection] = useState<Section>('profile')
  const [firstName, setFirstName] = useState(defaultFirst)
  const [lastName, setLastName] = useState(defaultLast)
  const [theme, setTheme] = useState('system')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  const email = user?.email ?? ''
  const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || '?'

  const handleSave = async () => {
    const fullName = `${firstName} ${lastName}`.trim()
    if (!fullName) return
    setSaving(true)
    setSaveError('')
    try {
      // 1. Update profiles table (visible to project co-members)
      await updateMyProfile({ full_name: fullName })
      // 2. Update auth user_metadata so greeting + sidebar reflect change immediately
      const supabase = createClient()
      await supabase.auth.updateUser({ data: { full_name: fullName } })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
  }

  if (authLoading) {
    return (
      <>
        <Topbar title="Settings" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Topbar title="Settings" />
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <p className="text-sm text-slate-400 mt-0.5">Manage your account and preferences.</p>
        </div>

        <div className="flex gap-6 max-w-3xl">
          {/* Left nav */}
          <div className="w-44 flex-shrink-0">
            <nav className="flex flex-col gap-1">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === s.id
                      ? 'bg-indigo-600/20 text-indigo-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeSection === 'profile' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-5">Profile Information</h3>

                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-indigo-700 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">{initials}</span>
                    </div>
                    <button
                      title="Photo upload coming in a later phase"
                      disabled
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center cursor-not-allowed opacity-60"
                    >
                      <Camera size={11} className="text-slate-400" />
                    </button>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {firstName || lastName ? `${firstName} ${lastName}`.trim() : email}
                    </p>
                    <p className="text-xs text-slate-400">Student</p>
                    <p className="text-xs text-slate-500 mt-0.5">JPG, GIF or PNG. Max size 800K</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Input
                    label="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <Input
                    label="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="mb-6">
                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    disabled
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Email is managed by Supabase Auth and cannot be changed here.
                  </p>
                </div>

                {saveError && (
                  <p className="text-xs text-red-400 mb-3">{saveError}</p>
                )}
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
                </Button>
              </div>
            )}

            {activeSection === 'preferences' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-5">Preferences</h3>
                <div className="max-w-xs">
                  <SelectInput
                    label="Theme"
                    options={THEME_OPTIONS}
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Full theme switching coming in a later phase. Currently dark mode only.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'account' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-2">Account</h3>
                <p className="text-sm text-slate-400 mb-6">Signed in as <span className="text-slate-300">{email}</span></p>
                <Button
                  variant="destructive"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  <LogOut size={14} />
                  {signingOut ? 'Signing out…' : 'Sign Out'}
                </Button>
                <p className="text-xs text-slate-500 mt-3">
                  You will be redirected to the login page.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
