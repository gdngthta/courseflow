import { Sidebar } from '@/components/layout/Sidebar'
import { AuthProvider } from '@/contexts/AuthContext'
import { DataProvider } from '@/contexts/DataContext'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>
        <div className="min-h-screen bg-slate-950">
          <Sidebar />
          <div className="pl-60">
            <main className="pt-16 min-h-screen">
              {children}
            </main>
          </div>
        </div>
      </DataProvider>
    </AuthProvider>
  )
}
