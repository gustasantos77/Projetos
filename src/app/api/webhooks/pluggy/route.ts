import { NextRequest, NextResponse } from 'next/server'
import { syncTransactionsByItemId } from '@/lib/sync-transactions'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event, itemId } = body as { event?: string; itemId?: string }

    console.log('[webhook] received:', event, itemId)

    if (!event) {
      return NextResponse.json({ error: 'event obrigatório' }, { status: 400 })
    }

    if (event === 'item/updated' || event === 'transactions/created' || event === 'transactions/updated') {
      if (itemId) {
        syncTransactionsByItemId(itemId).catch((err) => {
          console.error('[webhook] sync error:', err)
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[webhook] error:', error)
    return NextResponse.json({ ok: true })
  }
}
