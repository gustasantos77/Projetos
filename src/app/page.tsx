'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Dashboard from '@/components/Dashboard'
import FinanceNav from '@/components/FinanceNav'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/auth/signin'
    }
  }, [status])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--blue-600)] mx-auto mb-4" />
          <p className="text-sm text-[var(--muted-foreground)]">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <main className="p-4 md:p-6 pb-20 space-y-6 max-w-7xl mx-auto">
      <FinanceNav />
      <Dashboard />
      <PWAInstallPrompt />
    </main>
  )
}
