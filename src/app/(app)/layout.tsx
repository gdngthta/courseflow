import { Sidebar } from '@/components/layout/Sidebar'
import { MockStoreProvider } from '@/store/mockStore'
import { AuthProvider } from '@/contexts/AuthContext'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
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
    </AuthProvider>
  )
}
