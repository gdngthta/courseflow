import { Sidebar } from '@/components/layout/Sidebar'
import { ProfileGate } from '@/components/layout/ProfileGate'
import { AuthProvider } from '@/contexts/AuthContext'
import { DataProvider } from '@/contexts/DataContext'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProfileGate>
        <DataProvider>
          <div className="min-h-screen bg-white dark:bg-slate-950">
            <Sidebar />
            <div className="pl-60">
              <main className="pt-16 min-h-screen">
                {children}
              </main>
            </div>
          </div>
        </DataProvider>
      </ProfileGate>
    </AuthProvider>
  )
}
