'use client'

import { useEffect, useState } from 'react'
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  BotMessageSquare,
  Info,
} from 'lucide-react'
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

const BOT_COMMANDS = [
  { cmd: '/start', desc: 'greet the bot and see all commands' },
  { cmd: '/critical', desc: 'tasks that need immediate attention' },
  { cmd: '/today', desc: "today's tasks and urgent items" },
  { cmd: '/upcoming', desc: 'all deadlines in the next 7 days' },
  { cmd: '/closest', desc: 'your single nearest upcoming deadline' },
  { cmd: '/projects', desc: 'active group projects' },
  { cmd: '/help', desc: 'show the full command list' },
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
        if (!cancelled)
          setLoadError(
            e instanceof Error ? e.message : 'Failed to load reminder settings.'
          )
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
      setSaveMsg('Settings saved.')
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
      setTestMsg('Test message sent! Check your Telegram.')
      setTimeout(() => setTestMsg(''), 4000)
    } catch (e) {
      setTestError(
        e instanceof Error ? e.message : 'Failed to send test message.'
      )
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

  // Most-recent successfully sent log entry.
  const lastSent = logs.find((l) => l.status === 'sent')

  return (
    <div className="flex flex-col gap-5">

      {/* ── Card 1: Telegram Integration ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-5">
          <BotMessageSquare size={18} className="text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-white">Telegram Integration</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Connect your Telegram account to receive scheduled reminders and query
              your tasks on demand via{' '}
              <a
                href="https://t.me/CourseFlow_Schedule_Bot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline font-medium"
              >
                @CourseFlow_Schedule_Bot
              </a>
              .
            </p>
          </div>
        </div>

        {loadError && (
          <p className="text-xs text-red-400 mb-4 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
            {loadError}
          </p>
        )}

        {/* Status pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          <StatusPill
            active={isConnected}
            activeLabel="Telegram connected"
            inactiveLabel="Not connected"
          />
          <StatusPill
            active={scheduleActive}
            activeLabel="Scheduled reminders on"
            inactiveLabel="Scheduled reminders off"
            icon={<Clock size={11} />}
          />
        </div>

        {/* How to connect — numbered steps */}
        <div className="mb-5 bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3">
          <p className="text-xs font-semibold text-slate-300 mb-2.5">How to connect</p>
          <ol className="flex flex-col gap-2.5">
            <Step n={1}>
              Open Telegram and search for{' '}
              <a
                href="https://t.me/CourseFlow_Schedule_Bot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline"
              >
                @CourseFlow_Schedule_Bot
              </a>
            </Step>
            <Step n={2}>
              Send{' '}
              <code className="text-indigo-300 bg-slate-700 px-1 rounded text-[11px]">
                /start
              </code>{' '}
              to the bot — it will greet you and list available commands
            </Step>
            <Step n={3}>
              Get your numeric chat ID from{' '}
              <a
                href="https://t.me/userinfobot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline"
              >
                @userinfobot
              </a>{' '}
              (send it any message and copy the <em>Id</em> number)
            </Step>
            <Step n={4}>
              Paste the ID below, enable the toggle, then click{' '}
              <strong className="text-slate-200">Save Reminder Settings</strong>
            </Step>
          </ol>
        </div>

        {/* Chat ID input + toggle */}
        <div className="flex flex-col gap-4">
          <Input
            label="Telegram Chat ID"
            placeholder="e.g., 123456789"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
          />
          <ToggleRow
            label="Enable Telegram integration"
            description="Master switch — required for scheduled reminders and bot command responses."
            checked={telegramEnabled}
            onChange={setTelegramEnabled}
          />
        </div>
      </div>

      {/* ── Card 2: Bot Commands ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-1">Bot Commands</h3>
        <p className="text-xs text-slate-400 mb-4">
          Once connected, send any of these to the bot in Telegram.
          Natural-language phrases work too — e.g.{' '}
          <span className="text-slate-300 italic">&quot;what should I do today&quot;</span>.
        </p>
        <ul className="flex flex-col gap-2">
          {BOT_COMMANDS.map(({ cmd, desc }) => (
            <li key={cmd} className="flex items-baseline gap-2 text-xs">
              <code className="text-indigo-400 font-mono w-24 flex-shrink-0">{cmd}</code>
              <span className="text-slate-400">{desc}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Card 3: Reminder Preferences ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-3">Reminder Preferences</h3>

        {/* Reminder logic helper */}
        <div className="flex items-start gap-2 bg-indigo-950/40 border border-indigo-800/40 rounded-lg px-3 py-2.5 mb-5">
          <Info size={13} className="text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400">
            Scheduled reminders are sent for{' '}
            <span className="text-slate-200 font-medium">high-risk tasks</span> and{' '}
            <span className="text-slate-200 font-medium">deadlines around the corner</span>.
            The daily cron runs at <strong className="text-slate-200">08:00 UTC</strong> and
            sends at most one message per task per day.
          </p>
        </div>

        {/* Last reminder sent */}
        {lastSent && (
          <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
            <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />
            Last reminder sent:{' '}
            <span className="text-slate-300">
              {new Date(lastSent.sent_at).toLocaleString()}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-3 mb-5">
          <ToggleRow
            label="Enable scheduled reminders"
            description="Run the daily check and send messages for matching tasks."
            checked={enabled}
            onChange={setEnabled}
          />
          <ToggleRow
            label="Around-the-corner deadlines"
            description="Notify before a task's due date, based on the window you choose below."
            checked={aroundDeadline}
            onChange={setAroundDeadline}
          />
          <ToggleRow
            label="High-risk tasks"
            description="Notify when a task is critical — overdue, or low progress with little time left."
            checked={highRisk}
            onChange={setHighRisk}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <SelectInput
            label="Days before deadline"
            options={DAYS_BEFORE_OPTIONS}
            value={String(daysBefore)}
            onChange={(e) => setDaysBefore(Number(e.target.value) as ReminderDaysBefore)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Send time</label>
            <input
              type="time"
              value={sendTime}
              disabled
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500">
              Fixed at 08:00 UTC in the MVP. Custom send times are a planned future feature.
            </p>
          </div>
        </div>

        {saveError && (
          <p className="text-xs text-red-400 mb-4 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
            {saveError}
          </p>
        )}
        {saveMsg && <p className="text-xs text-emerald-400 mb-4">{saveMsg}</p>}

        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Reminder Settings'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleSendTest}
            disabled={testing || !isConnected}
          >
            <Send size={13} />
            {testing ? 'Sending…' : 'Send Test Message'}
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
            Connect Telegram and save settings before sending a test message.
          </p>
        )}
      </div>

      {/* ── Card 4: Recent Reminder Logs ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-1">Recent Reminders Sent</h3>
        <p className="text-xs text-slate-400 mb-4">
          Up to 5 most recent reminders. Updated after each cron run (daily at 08:00 UTC).
        </p>
        {logs.length === 0 ? (
          <p className="text-xs text-slate-500">No reminders sent yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex items-start gap-3 text-xs px-3 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-lg"
              >
                {log.status === 'sent' ? (
                  <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200">
                    {log.reminder_type === 'around_deadline'
                      ? 'Around-deadline reminder'
                      : 'High-risk reminder'}
                    <span className="text-slate-500 ml-1.5">
                      · {log.task_type === 'personal' ? 'Personal task' : 'Project task'}
                    </span>
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    {new Date(log.sent_at).toLocaleString()}
                    {log.status === 'failed' && log.error_message && (
                      <span className="text-red-400 ml-1.5">— {log.error_message}</span>
                    )}
                  </p>
                </div>
                <span
                  className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                    log.status === 'sent'
                      ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50'
                      : 'bg-red-900/30 text-red-400 border-red-800/50'
                  }`}
                >
                  {log.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ── Helpers ──

interface StatusPillProps {
  active: boolean
  activeLabel: string
  inactiveLabel: string
  icon?: React.ReactNode
}

function StatusPill({ active, activeLabel, inactiveLabel, icon }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        active
          ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50'
          : 'bg-slate-800 text-slate-400 border-slate-700'
      }`}
    >
      {icon ?? <CheckCircle2 size={11} />}
      {active ? activeLabel : inactiveLabel}
    </span>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-xs text-slate-400">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 flex items-center justify-center text-[10px] font-bold mt-0.5">
        {n}
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
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
