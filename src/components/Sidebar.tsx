'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const navItems = [
  { label: 'Dashboard', href: '/', icon: '📊' },
  { label: 'Cadastrar', href: '/cadastrar', icon: '➕' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserName(user.user_metadata?.display_name || user.email || '')
      }
    }
    getUser()
  }, [])

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6">
        <div className="rounded-2xl p-4 flex items-center justify-center">
          <img src="/logo-apruma.png" alt="Apruma" className="h-12 object-contain" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-50 text-brand-700 border border-brand-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 space-y-3">
        {userName && (
          <div className="px-4 py-2 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400">Logado como</p>
            <p className="text-sm font-medium text-gray-700 truncate">{userName}</p>
          </div>
        )}
        <button
          onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          🚪 Sair
        </button>
      </div>
    </aside>
  )
}
