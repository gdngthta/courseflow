'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, BookOpen, FolderKanban, CheckSquare, X } from 'lucide-react'
import { useData } from '@/contexts/DataContext'
import { runGlobalSearch, type SearchResult } from '@/lib/globalSearch'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import type { TaskCardData, TaskChecklistItem } from '@/types'

/**
 * Global search.
 *
 * Desktop (sm+): persistent input in the topbar.
 * Mobile:        search icon → full-screen overlay.
 *
 * Closes on Escape, click outside (desktop) or close button (mobile).
 */
export function GlobalSearch() {
  const router = useRouter()
  const { userId, courses, personalTasks, projects, updatePersonalTaskChecklist, updateProjectTaskChecklist } = useData()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskCardData | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mobileInputRef = useRef<HTMLInputElement | null>(null)

  // ── Search results ──
  const results = useMemo(
    () => runGlobalSearch(query, { userId, courses, personalTasks, projects }),
    [query, userId, courses, personalTasks, projects]
  )
  const total = results.tasks.length + results.projects.length + results.courses.length
  const isSearching = query.trim().length >= 2

  // ── Click-outside + Escape (desktop) ──
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  // ── Escape (mobile overlay) ──
  useEffect(() => {
    if (!mobileOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMobile()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileOpen])

  // Focus mobile input when overlay opens
  useEffect(() => {
    if (mobileOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 50)
    }
  }, [mobileOpen])

  const closeMobile = useCallback(() => {
    setMobileOpen(false)
    setQuery('')
  }, [])

  const handleResultClick = useCallback(
    (r: SearchResult) => {
      if (r.task) {
        setSelectedTask(r.task)
        setOpen(false)
        setMobileOpen(false)
        setQuery('')
        return
      }
      router.push(r.href)
      setOpen(false)
      setMobileOpen(false)
      setQuery('')
    },
    [router]
  )

  const handleChecklistUpdate = (taskId: string, checklist: TaskChecklistItem[]) => {
    const isPersonal = personalTasks.some((t) => t.id === taskId)
    if (isPersonal) updatePersonalTaskChecklist(taskId, checklist)
    else updateProjectTaskChecklist(taskId, checklist)
  }

  const resultDropdown = isSearching ? (
    <div className="absolute top-full right-0 mt-2 w-[28rem] max-w-[calc(100vw-2rem)] max-h-[28rem] overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-2 z-50">
      {total === 0 ? (
        <p className="px-4 py-6 text-xs text-slate-500 text-center">
          No results for &ldquo;{query}&rdquo;
        </p>
      ) : (
        <>
          <ResultGroup label="Tasks" icon={<CheckSquare size={12} />} items={results.tasks} onClick={handleResultClick} />
          <ResultGroup label="Projects" icon={<FolderKanban size={12} />} items={results.projects} onClick={handleResultClick} />
          <ResultGroup label="Courses" icon={<BookOpen size={12} />} items={results.courses} onClick={handleResultClick} />
        </>
      )}
    </div>
  ) : null

  return (
    <>
      {/* ── Desktop search (sm+) ── */}
      <div ref={containerRef} className="relative hidden sm:flex items-center">
        <Search size={14} className="absolute left-3 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search tasks, projects, courses..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className="pl-9 pr-4 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 w-56 lg:w-64 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
        />
        {open && resultDropdown}
      </div>

      {/* ── Mobile search icon ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="sm:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        aria-label="Search"
      >
        <Search size={18} />
      </button>

      {/* ── Mobile full-screen search overlay ── */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-slate-950 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800 flex-shrink-0">
            <Search size={16} className="text-slate-500 flex-shrink-0" />
            <input
              ref={mobileInputRef}
              type="text"
              placeholder="Search tasks, projects, courses..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
            />
            <button
              onClick={closeMobile}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              aria-label="Close search"
            >
              <X size={18} />
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {!isSearching ? (
              <p className="px-4 py-8 text-xs text-slate-500 text-center">
                Type 2+ characters to search…
              </p>
            ) : total === 0 ? (
              <p className="px-4 py-8 text-xs text-slate-500 text-center">
                No results for &ldquo;{query}&rdquo;
              </p>
            ) : (
              <>
                <ResultGroup label="Tasks" icon={<CheckSquare size={12} />} items={results.tasks} onClick={handleResultClick} />
                <ResultGroup label="Projects" icon={<FolderKanban size={12} />} items={results.projects} onClick={handleResultClick} />
                <ResultGroup label="Courses" icon={<BookOpen size={12} />} items={results.courses} onClick={handleResultClick} />
              </>
            )}
          </div>
        </div>
      )}

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onChecklistUpdate={handleChecklistUpdate}
      />
    </>
  )
}

// ── Result group ──

interface ResultGroupProps {
  label: string
  icon: React.ReactNode
  items: SearchResult[]
  onClick: (r: SearchResult) => void
}

function ResultGroup({ label, icon, items, onClick }: ResultGroupProps) {
  if (items.length === 0) return null
  return (
    <div className="mb-1 last:mb-0">
      <div className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <ul>
        {items.map((r) => (
          <li key={`${r.kind}-${r.id}`}>
            <button
              onClick={() => onClick(r)}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-800 transition-colors flex flex-col"
            >
              <span className="text-sm text-slate-200 truncate">{r.title}</span>
              <span className="text-xs text-slate-500 truncate">{r.subtitle}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
