import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AppShell from '@/components/AppShell'

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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
