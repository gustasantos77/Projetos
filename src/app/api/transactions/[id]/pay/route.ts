import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { markTransactionAsPaid } from '@/lib/finance-service'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth()
    const { id } = await params

    const transaction = await markTransactionAsPaid(id)
    return NextResponse.json(transaction)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
