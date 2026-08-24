import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getDashboardStats } from '@/lib/finance-service'

export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth()
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined

    const stats = await getDashboardStats(userId, month, year)
    return NextResponse.json({
      ...stats,
      transactionCount: stats.transactionCount,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
}
