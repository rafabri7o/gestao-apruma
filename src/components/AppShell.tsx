'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import AuthGuard from '@/components/AuthGuard'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/login'

  if (isLogin) {
    return <>{children}</>
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="ml-64 flex-1 p-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
