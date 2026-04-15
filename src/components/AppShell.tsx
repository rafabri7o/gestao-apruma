'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import AuthGuard from '@/components/AuthGuard'
import { useUserRole } from '@/lib/useUserRole'

const mentorAllowedPaths = ['/', '/sos-mentores', '/login']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { role, loading } = useUserRole()
  const isLogin = pathname === '/login'

  useEffect(() => {
    if (loading || isLogin) return
    if (role === 'mentor' && !mentorAllowedPaths.includes(pathname)) {
      router.replace('/sos-mentores')
    }
  }, [role, loading, pathname, isLogin, router])

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
