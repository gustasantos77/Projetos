import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createInstallmentTransaction } from '@/lib/finance-service'
import { validateRequest, createTransactionSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth()
    const body = await req.json()

    const validation = validateRequest(createTransactionSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
    }

    const { description, amount, type, date, categoryId, bankAccountId, notes, totalInstallments } = validation.data

    if (!totalInstallments || totalInstallments < 2) {
      return NextResponse.json({ error: 'Total de parcelas deve ser pelo menos 2' }, { status: 400 })
    }

    const transactions = await createInstallmentTransaction(userId, {
      description,
      amount,
      type,
      date: new Date(date),
      categoryId,
      bankAccountId,
      notes,
      totalInstallments,
    })

    return NextResponse.json(transactions)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
