import Link from 'next/link'
import { OwlMascot } from '@/components/brand/OwlMascot'

export function LandingFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <OwlMascot size={28} />
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">CourseFlow</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Student productivity for personal &amp; group coursework.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <a href="#features" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</a>
          <a href="#workflow" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Workflow</a>
          <a href="#about" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About</a>
          <Link href="/login" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Login</Link>
          <a
            href="https://github.com/gdngthta/courseflow"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
      <p className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 text-xs text-slate-500 dark:text-slate-500">
        © {year} CourseFlow · Built as a university coursework MVP.
      </p>
    </footer>
  )
}
