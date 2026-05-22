import { Topbar } from '@/components/layout/Topbar'

export default function SettingsPage() {
  return (
    <>
      <Topbar title="Settings" />
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <p className="text-sm text-slate-400 mt-0.5">Manage your account and preferences.</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
          <p className="text-slate-400 text-sm">Settings page coming in a later phase.</p>
          <p className="text-slate-600 text-xs mt-1">This page will have Profile, Preferences, and Account sections.</p>
        </div>
      </div>
    </>
  )
}
