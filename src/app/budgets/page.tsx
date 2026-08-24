'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import BudgetOverview from '@/components/BudgetOverview'
import FinanceNav from '@/components/FinanceNav'

export default function BudgetsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--blue-600)]" />
      </div>
    )
  }

  if (!session) return null

  return (
    <main className="p-4 md:p-6 pb-20 space-y-6 max-w-7xl mx-auto">
      <FinanceNav />
      <BudgetOverview />
    </main>
  )
}
