import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth()

    const { searchParams } = new URL(req.url)
    const month = Number(searchParams.get('month') ?? new Date().getMonth() + 1)
    const year = Number(searchParams.get('year') ?? new Date().getFullYear())

    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59)

    const creditCard = await prisma.bankAccount.findFirst({
      where: {
        userId,
        type: 'CREDIT_CARD',
      },
    })

    if (!creditCard) {
      return NextResponse.json({
        account: null,
        transactions: [],
        totalExpenses: 0,
        totalPayments: 0,
        currentBalance: 0,
        transactionCount: 0,
      })
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        bankAccountId: creditCard.id,
        date: { gte: start, lte: end },
      },
      include: { category: true },
      orderBy: { date: 'desc' },
    })

    const isDebit = (desc: string) => desc.includes('Compra no débito')

    const totalExpenses = transactions
      .filter(t => t.type === 'EXPENSE' && !isDebit(t.description))
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalPayments = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    return NextResponse.json({
      account: {
        id: creditCard.id,
        name: creditCard.name,
        institution: creditCard.institution,
        balance: creditCard.balance,
        type: creditCard.type,
      },
      transactions,
      totalExpenses,
      totalPayments,
      currentBalance: totalExpenses - totalPayments,
      transactionCount: transactions.length,
    })
  } catch {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
}
