import Link from 'next/link'
import { ArrowRight, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react'

/**
 * Hero with headline + CTAs on the left and a dashboard preview
 * card on the right. Small floating task cards around the preview
 * give a sense of motion without a heavy animation library.
 */
export function LandingHero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Soft purple glow background */}
      <div
        aria-hidden
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-indigo-400/15 dark:bg-indigo-600/10 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute top-40 right-0 w-72 h-72 rounded-full bg-violet-400/10 dark:bg-violet-600/10 blur-3xl pointer-events-none"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center relative">
        {/* Left: copy + CTAs */}
        <div className="cf-fade-up">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50 text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Built for university students
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] leading-[1.1] font-semibold tracking-tight text-slate-900 dark:text-white">
            Manage personal tasks and{' '}
            <span className="text-indigo-600 dark:text-indigo-400">group projects</span> in one place.
          </h1>
          <p className="mt-5 text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
            CourseFlow tracks coursework, shared responsibilities, deadlines, and progress —
            without switching between WhatsApp, Drive, classroom portals, and sticky notes.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-md shadow-indigo-600/25 transition-all hover:shadow-lg hover:shadow-indigo-600/30"
            >
              Get started — free for students
              <ArrowRight size={15} />
            </Link>
            <a
              href="#preview"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              View demo
            </a>
          </div>

          <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
            No credit card required. Sign in with email and password.
          </p>
        </div>

        {/* Right: dashboard preview */}
        <div id="preview" className="relative cf-fade-up" style={{ animationDelay: '120ms' }}>
          <DashboardPreviewCard />

          {/* Floating task pill cards — purely decorative */}
          <div
            className="hidden lg:block absolute -left-10 top-10 cf-float"
            style={{ animationDelay: '0.3s' }}
            aria-hidden
          >
            <FloatingPill
              icon={<AlertTriangle size={13} className="text-red-500" />}
              title="Submit Lab 3"
              meta="Due today · Critical"
              tint="red"
            />
          </div>
          <div
            className="hidden lg:block absolute -right-6 top-32 cf-float"
            style={{ animationDelay: '1.2s' }}
            aria-hidden
          >
            <FloatingPill
              icon={<Calendar size={13} className="text-violet-500" />}
              title="Group presentation"
              meta="Jun 12 · WIA2005"
              tint="violet"
            />
          </div>
          <div
            className="hidden lg:block absolute -left-4 -bottom-4 cf-float"
            style={{ animationDelay: '2.1s' }}
            aria-hidden
          >
            <FloatingPill
              icon={<CheckCircle2 size={13} className="text-emerald-500" />}
              title="Read Ch. 4"
              meta="Done"
              tint="emerald"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Decorative dashboard preview ──

function DashboardPreviewCard() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-black/40 p-5 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Today
        </p>
        <p className="text-xs text-slate-400">Mon, Jun 1</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatTile label="Today" value="3" />
        <StatTile label="Critical" value="2" accent />
        <StatTile label="Active" value="4" />
      </div>

      <div className="space-y-2">
        <PreviewRow tint="red" title="Submit Lab 3" sub="WIA1005 · Today" />
        <PreviewRow tint="violet" title="Database schema" sub="Group Project · 60%" />
        <PreviewRow tint="indigo" title="Read Ch. 4 & 5" sub="WIA1005 · Tomorrow" />
      </div>
    </div>
  )
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3">
      <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
      <p className={`text-xl font-bold ${accent ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
        {value}
      </p>
    </div>
  )
}

function PreviewRow({ tint, title, sub }: { tint: 'red' | 'violet' | 'indigo'; title: string; sub: string }) {
  const tintBg = {
    red: 'bg-red-500',
    violet: 'bg-violet-500',
    indigo: 'bg-indigo-500',
  }[tint]
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
      <span className={`w-1.5 h-1.5 rounded-full ${tintBg}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900 dark:text-white truncate">{title}</p>
        <p className="text-xs text-slate-500 truncate">{sub}</p>
      </div>
    </div>
  )
}

function FloatingPill({
  icon,
  title,
  meta,
  tint,
}: {
  icon: React.ReactNode
  title: string
  meta: string
  tint: 'red' | 'violet' | 'emerald'
}) {
  const tintBorder = {
    red: 'border-red-200 dark:border-red-800/60',
    violet: 'border-violet-200 dark:border-violet-800/60',
    emerald: 'border-emerald-200 dark:border-emerald-800/60',
  }[tint]
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 bg-white dark:bg-slate-900 border ${tintBorder} rounded-xl shadow-md shadow-slate-300/30 dark:shadow-black/40`}>
      {icon}
      <div>
        <p className="text-xs font-semibold text-slate-900 dark:text-white whitespace-nowrap">{title}</p>
        <p className="text-[10px] text-slate-500 whitespace-nowrap">{meta}</p>
      </div>
    </div>
  )
}
