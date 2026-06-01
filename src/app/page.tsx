import type { Metadata } from 'next'
import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { LandingHero } from '@/components/landing/LandingHero'
import { LandingFeatures } from '@/components/landing/LandingFeatures'
import { LandingPersonalVsShared } from '@/components/landing/LandingPersonalVsShared'
import { LandingWorkflow } from '@/components/landing/LandingWorkflow'
import { LandingFinalCTA } from '@/components/landing/LandingFinalCTA'
import { LandingFooter } from '@/components/landing/LandingFooter'

export const metadata: Metadata = {
  title: 'CourseFlow — Manage personal tasks and group projects in one place',
  description:
    'CourseFlow tracks coursework, shared responsibilities, deadlines, and progress without switching between WhatsApp, Drive, classroom portals, and sticky notes. Free for students.',
}

/**
 * Public landing page at `/`. Lives outside the (app) route group so
 * it does not mount AuthProvider/DataProvider — the page is fully
 * static and renders for visitors who are not signed in.
 *
 * Authenticated users can still visit `/`; they'll see the landing
 * with the standard "Login / Get Started" nav. Clicking those takes
 * them to /login which proxy.ts redirects to /dashboard if they
 * already have a session.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingPersonalVsShared />
        <LandingWorkflow />
        <LandingFinalCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
