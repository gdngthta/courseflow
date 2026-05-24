import { Sidebar } from '@/components/layout/Sidebar'
import { MockStoreProvider } from '@/store/mockStore'
import { AuthProvider } from '@/contexts/AuthContext'
import { DataProvider } from '@/contexts/DataContext'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>
        {/* MockStoreProvider still backs projects/members/project-tasks
            until Phase 3C, and Dashboard/Calendar until Phase 3D. */}
        <MockStoreProvider>
          <div className="min-h-screen bg-slate-950">
            <Sidebar />
            <div className="pl-60">
              <main className="pt-16 min-h-screen">
                {children}
              </main>
            </div>
          </div>
        </MockStoreProvider>
      </DataProvider>
    </AuthProvider>
  )
}
