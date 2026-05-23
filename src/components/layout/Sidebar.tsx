'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  BookOpen,
  Calendar,
  Settings,
  LogOut,
} from 'lucide-react'
import { OwlMascot } from '@/components/brand/OwlMascot'
import { MOCK_USER } from '@/data/mock'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'My Tasks', icon: CheckSquare },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  const initials = `${MOCK_USER.first_name[0]}${MOCK_USER.last_name[0]}`

  return (
    <aside className="fixed inset-y-0 left-0 w-60 flex flex-col bg-slate-900 border-r border-slate-800 z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-800">
        <OwlMascot size={32} className="flex-shrink-0 opacity-90" />
        <span className="text-white font-semibold text-sm tracking-tight">CourseFlow</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{MOCK_USER.first_name}</p>
            <p className="text-xs text-slate-500">Student</p>
          </div>
        </div>
        <button className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
          <LogOut size={16} />
          Log Out
        </button>
      </div>
    </aside>
  )
}
