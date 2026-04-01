import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Painel de Mentoria — Rafa Brito',
  description: 'Gestão de mentorados — Apruma',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50 min-h-screen`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="ml-64 flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
