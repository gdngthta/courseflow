import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { OwlMascot } from '@/components/brand/OwlMascot'

export function LandingFinalCTA() {
  return (
    <section className="py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="relative bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 sm:p-10 md:p-14 text-center overflow-hidden">
          {/* Subtle decorative circles */}
          <div aria-hidden className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          <div aria-hidden className="absolute -bottom-16 -left-12 w-56 h-56 rounded-full bg-white/10 blur-2xl" />

          <OwlMascot size={48} variant="reading" className="mx-auto mb-5 opacity-95" />

          <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
            Start organising your coursework today.
          </h2>
          <p className="mt-3 text-sm md:text-base text-indigo-100 max-w-md mx-auto">
            Free for students. Sign up with email, add your courses, and never lose track of a
            deadline again.
          </p>

          <Link
            href="/signup"
            className="mt-7 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-700 hover:bg-indigo-50 text-sm font-semibold rounded-lg shadow-lg shadow-indigo-900/30 transition-colors"
          >
            Create your free account
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  )
}
