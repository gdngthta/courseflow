import { Topbar } from '@/components/layout/Topbar'
import Link from 'next/link'

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return (
    <>
      <Topbar title="Project Detail" />
      <div className="p-6">
        <Link href="/projects" className="text-sm text-slate-400 hover:text-slate-200 transition-colors mb-4 inline-block">
          ← Back to Projects
        </Link>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
          <p className="text-slate-400 text-sm">Project detail for ID: {params.id}</p>
          <p className="text-slate-600 text-xs mt-1">This page will show project progress, tasks, members, and links.</p>
        </div>
      </div>
    </>
  )
}
