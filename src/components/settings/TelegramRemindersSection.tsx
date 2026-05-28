'use client'

import { useEffect, useState } from 'react'
import { Send, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { SelectInput } from '@/components/ui/SelectInput'
import { Button } from '@/components/ui/Button'
import { getMyProfile, updateMyProfile } from '@/lib/api/profiles'
import {
  getMyReminderPreferences,
  upsertMyReminderPreferences,
  getMyRecentReminderLogs,
} from '@/lib/api/reminders'
import type { ReminderDaysBefore, ReminderLog } from '@/types'

const DAYS_BEFORE_OPTIONS = [
  { value: '0', label: 'Same day' },
  { value: '1', label: '1 day before' },
  { value: '3', label: '3 days before' },
  { value: '7', label: '7 days before' },
]

export function TelegramRemindersSection() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // Telegram connection
  const [chatId, setChatId] = useState('')
  const [telegramEnabled, setTelegramEnabled] = useState(false)

  // Preferences
  const [enabled, setEnabled] = useState(true)
  const [aroundDeadline, setAroundDeadline] = useState(true)
  const [highRisk, setHighRisk] = useState(true)
  const [daysBefore, setDaysBefore] = useState<ReminderDaysBefore>(1)
  const [sendTime] = useState('08:00')

  // Save state
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [saveError, setSaveError] = useState('')

  // Test send state
  const [testing, setTesting] = useState(false)
  const [testMsg, setTestMsg] = useState('')
  const [testError, setTestError] = useState('')

  // Recent logs
  const [logs, setLogs] = useState<ReminderLog[]>([])

  // ── Initial load ──
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [profile, prefs, recentLogs] = await Promise.all([
          getMyProfile(),
          getMyReminderPreferences(),
          getMyRecentReminderLogs(5),
        ])
        if (cancelled) return
        setChatId(profile?.telegram_chat_id ?? '')
        setTelegramEnabled(profile?.telegram_enabled ?? false)
        if (prefs) {
          setEnabled(prefs.enabled)
          setAroundDeadline(prefs.around_deadline_enabled)
          setHighRisk(prefs.high_risk_enabled)
          setDaysBefore(prefs.days_before)
        }
        setLogs(recentLogs)
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load reminder settings.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    setSaveMsg('')
    try {
      const cleanedChatId = chatId.trim()
      await updateMyProfile({
        telegram_chat_id: cleanedChatId || null,
        telegram_enabled: telegramEnabled && cleanedChatId.length > 0,
      })
      await upsertMyReminderPreferences({
        enabled,
        around_deadline_enabled: aroundDeadline,
        high_risk_enabled: highRisk,
        days_before: daysBefore,
        send_time: sendTime,
      })
      setSaveMsg('Saved.')
      setTimeout(() => setSaveMsg(''), 2500)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const handleSendTest = async () => {
    setTesting(true)
    setTestError('')
    setTestMsg('')
    try {
      const res = await fetch('/api/telegram/test', { method: 'POST' })
      const data = (await res.json()) as { ok: boolean; error?: string }
      if (!data.ok) throw new Error(data.error || 'Telegram send failed.')
      setTestMsg('Test message sent. Check your Telegram chat.')
      setTimeout(() => setTestMsg(''), 4000)
    } catch (e) {
      setTestError(e instanceof Error ? e.message : 'Failed to send test message.')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <p className="text-sm text-slate-500">Loading reminder settings…</p>
      </div>
    )
  }

  const isConnected = chatId.trim().length > 0 && telegramEnabled
  const scheduleActive = isConnected && enabled

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-1">Telegram Integration</h3>
        <p className="text-xs text-slate-400 mb-5">
          Connect your Telegram account to receive scheduled reminders and ask the CourseFlow bot
          about your tasks on demand.
        </p>

        {loadError && (
          <p className="text-xs text-red-400 mb-4 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
            {loadError}
          </p>
        )}

        {/* Status pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isConnected
                ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <CheckCircle2 size={11} />
            {isConnected ? 'Telegram connected' : 'Not connected'}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              scheduleActive
                ? 'bg-indigo-900/30 text-indigo-400 border-indigo-800/50'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Clock size={11} />
            {scheduleActive ? 'Scheduled reminders enabled' : 'Scheduled reminders off'}
          </span>
        </div>

        {/* Chat ID + connection toggle */}
        <div className="flex flex-col gap-4">
          <div>
            <Input
              label="Telegram Chat ID"
              placeholder="e.g., 123456789"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">
              Open Telegram, message{' '}
              <span className="text-slate-300">@CourseFlowBot</span> (or your configured bot), then
              forward any of its messages to{' '}
              <span className="text-slate-300">@userinfobot</span> to get your numeric chat ID.
            </p>
          </div>

          <ToggleRow
            label="Enable Telegram integration"
            description="Master switch. Required for scheduled reminders AND for the bot to respond to your commands."
            checked={telegramEnabled}
            onChange={setTelegramEnabled}
          />
        </div>
      </div>

      {/* Bot commands reference */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-1">Bot Commands</h3>
        <p className="text-xs text-slate-400 mb-4">
          Once connected, message your bot in Telegram with any of these:
        </p>
        <ul className="flex flex-col gap-1.5 text-xs">
          <li><span className="text-indigo-400 font-mono">/critical</span> <span className="text-slate-400">— show critical tasks</span></li>
          <li><span className="text-indigo-400 font-mono">/today</span> <span className="text-slate-400">— show today&apos;s tasks</span></li>
          <li><span className="text-indigo-400 font-mono">/upcoming</span> <span className="text-slate-400">— show upcoming deadlines</span></li>
          <li><span className="text-indigo-400 font-mono">/closest</span> <span className="text-slate-400">— show your closest deadline</span></li>
          <li><span className="text-indigo-400 font-mono">/projects</span> <span className="text-slate-400">— show active projects</span></li>
          <li><span className="text-indigo-400 font-mono">/help</span> <span className="text-slate-400">— show command list</span></li>
        </ul>
        <p className="text-xs text-slate-500 mt-3">
          Natural-language aliases work too (e.g. &quot;what should i do today&quot;, &quot;closest deadline&quot;).
        </p>
      </div>

      {/* Preferences card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Reminder Preferences</h3>

        <div className="flex flex-col gap-3">
          <ToggleRow
            label="Scheduled reminders"
            description="Run the daily check and send messages based on the toggles below."
            checked={enabled}
            onChange={setEnabled}
          />
          <ToggleRow
            label="Around-the-corner deadlines"
            description="Notify before a task's due date, based on the window selected below."
            checked={aroundDeadline}
            onChange={setAroundDeadline}
          />
          <ToggleRow
            label="High-risk tasks"
            description="Notify when a task is calculated as critical (overdue, or low progress with little time left)."
            checked={highRisk}
            onChange={setHighRisk}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <SelectInput
            label="Days before deadline"
            options={DAYS_BEFORE_OPTIONS}
            value={String(daysBefore)}
            onChange={(e) => setDaysBefore(Number(e.target.value) as ReminderDaysBefore)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Preferred send time</label>
            <input
              type="time"
              value={sendTime}
              disabled
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-400 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500">
              The MVP cron runs once daily (08:00 UTC). Exact custom send times are not implemented.
            </p>
          </div>
        </div>

        {saveError && (
          <p className="text-xs text-red-400 mt-4 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
            {saveError}
          </p>
        )}
        {saveMsg && <p className="text-xs text-emerald-400 mt-4">{saveMsg}</p>}

        <div className="flex flex-wrap gap-3 mt-5">
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Reminder Settings'}
          </Button>
          <Button variant="secondary" onClick={handleSendTest} disabled={testing || !isConnected}>
            <Send size={13} />
            {testing ? 'Sending…' : 'Send Test Reminder'}
          </Button>
        </div>
        {testMsg && <p className="text-xs text-emerald-400 mt-3">{testMsg}</p>}
        {testError && (
          <p className="text-xs text-red-400 mt-3 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
            {testError}
          </p>
        )}
        {!isConnected && (
          <p className="text-xs text-slate-500 mt-3">
            Save a chat ID and enable Telegram reminders to send a test message.
          </p>
        )}
      </div>

      {/* Recent logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-1">Recent Reminders</h3>
        <p className="text-xs text-slate-400 mb-4">
          The 5 most recent reminders sent on your behalf. Updated after each cron run.
        </p>
        {logs.length === 0 ? (
          <p className="text-xs text-slate-500">No reminders sent yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex items-start gap-3 text-xs px-3 py-2 bg-slate-800/50 border border-slate-800 rounded-lg"
              >
                {log.status === 'sent' ? (
                  <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200">
                    {log.reminder_type === 'around_deadline' ? 'Around-deadline' : 'High-risk'}{' '}
                    reminder
                    <span className="text-slate-500"> · {log.task_type} task</span>
                  </p>
                  <p className="text-slate-500">
                    {new Date(log.sent_at).toLocaleString()}
                    {log.status === 'failed' && log.error_message && (
                      <span className="text-red-400"> — {log.error_message}</span>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

interface ToggleRowProps {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors mt-1 ${
          checked ? 'bg-indigo-600' : 'bg-slate-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}
