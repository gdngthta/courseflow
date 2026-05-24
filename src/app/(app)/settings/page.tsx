'use client'

import { useState } from 'react'
import { Camera, LogOut } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Input } from '@/components/ui/Input'
import { SelectInput } from '@/components/ui/SelectInput'
import { Button } from '@/components/ui/Button'
import { MOCK_USER } from '@/data/mock'

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
  const [activeSection, setActiveSection] = useState<Section>('profile')
  const [firstName, setFirstName] = useState(MOCK_USER.first_name)
  const [lastName, setLastName] = useState(MOCK_USER.last_name)
  const [email] = useState(MOCK_USER.email)
  const [theme, setTheme] = useState('system')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
                      <span className="text-white text-xl font-bold">
                        {firstName.charAt(0)}{lastName.charAt(0)}
                      </span>
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-full flex items-center justify-center transition-colors">
                      <Camera size={11} className="text-slate-300" />
                    </button>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{firstName} {lastName}</p>
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
                  <p className="text-xs text-slate-500 mt-1">Email cannot be changed here. Managed by auth provider.</p>
                </div>

                <Button variant="primary" onClick={handleSave}>
                  {saved ? '✓ Saved' : 'Save Changes'}
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
                <p className="text-sm text-slate-400 mb-6">Signed in as {email}</p>
                <Button
                  variant="destructive"
                  onClick={() => alert('Sign out — auth not connected yet (Phase 1).')}
                >
                  <LogOut size={14} />
                  Sign Out
                </Button>
                <p className="text-xs text-slate-500 mt-3">
                  Auth is not connected yet. Sign out will be functional in Phase 3.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
