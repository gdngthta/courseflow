import { Sidebar } from '@/components/layout/Sidebar'
import { ProfileGate } from '@/components/layout/ProfileGate'
import { AuthProvider } from '@/contexts/AuthContext'
import { DataProvider } from '@/contexts/DataContext'
import { MobileSidebarProvider } from '@/contexts/MobileSidebarContext'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProfileGate>
        <DataProvider>
          <MobileSidebarProvider>
            <div className="min-h-screen bg-slate-950">
              <Sidebar />
              {/* Main content — offset by sidebar only on lg+ */}
              <div className="lg:pl-60">
                <main className="pt-16 min-h-screen">
                  {children}
                </main>
              </div>
            </div>
          </MobileSidebarProvider>
        </DataProvider>
      </ProfileGate>
    </AuthProvider>
  )
}
