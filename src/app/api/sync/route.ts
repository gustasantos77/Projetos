import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getBankAccounts, createBankAccount, deleteBankAccount } from '@/lib/finance-service'
import { getAccounts, getItem, getTransactions } from '@/lib/pluggy'
import { validateRequest, syncActionSchema } from '@/lib/validations'

export async function GET() {
  try {
    const userId = await requireAuth()
    const accounts = await getBankAccounts(userId)
    return NextResponse.json(accounts)
  } catch {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth()
    const body = await req.json()

    const validation = validateRequest(syncActionSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
    }

    const { action } = validation.data

    if (action === 'connect') {
      const connectToken = await import('@/lib/pluggy').then(m => m.createConnectToken())
      return NextResponse.json({ token: connectToken.token ?? connectToken.accessToken })
    }

    if (action === 'add') {
      const { itemId } = validation.data
      if (!itemId) return NextResponse.json({ error: 'itemId obrigatório' }, { status: 400 })

      const item = await getItem(itemId)
      const accounts = await getAccounts(itemId)

      const created = []
      for (const acc of accounts.results) {
        const { prisma } = await import('@/lib/prisma')
        const exists = await prisma.bankAccount.findFirst({ where: { pluggyAccountId: acc.id } })
        if (!exists) {
          const institutionName = acc.institution?.name ?? item.connector?.name ?? item.institution?.name ?? 'Desconhecido'
          const newAcc = await createBankAccount(userId, {
            name: acc.name,
            type: acc.type,
            institution: institutionName,
            pluggyItemId: itemId,
            pluggyAccountId: acc.id,
            balance: acc.balance,
          })
          created.push(newAcc)
        }
      }

      return NextResponse.json({ accounts: created })
    }

    if (action === 'sync') {
      const { prisma } = await import('@/lib/prisma')
      const bankAccounts = await getBankAccounts(userId)
      let imported = 0

      for (const account of bankAccounts) {
        if (!account.pluggyAccountId) continue

        const transactions = await getTransactions(account.pluggyAccountId)
        const isCreditCard = String(account.type).toUpperCase().includes('CREDIT')

        for (const tx of transactions.results) {
          if (!tx.id) continue

          const amount = Number(tx.amount ?? 0)
          const type = isCreditCard
            ? amount >= 0 ? 'EXPENSE' : 'INCOME'
            : tx.type === 'CREDIT' ? 'INCOME' : 'EXPENSE'

          await prisma.transaction.upsert({
            where: { pluggyId: tx.id },
            update: {
              description: tx.description ?? tx.descriptionRaw ?? 'Transação bancária',
              amount: Math.abs(amount),
              type,
              date: new Date(tx.date + 'T12:00:00'),
              bankAccountId: account.id,
            },
            create: {
              userId,
              bankAccountId: account.id,
              pluggyId: tx.id,
              description: tx.description ?? tx.descriptionRaw ?? 'Transação bancária',
              amount: Math.abs(amount),
              type,
              date: new Date(tx.date + 'T12:00:00'),
            },
          })
          imported++
        }

        await prisma.bankAccount.update({
          where: { id: account.id },
          data: { lastSyncAt: new Date() },
        })
      }

      return NextResponse.json({ imported })
    }

    if (action === 'delete') {
      const { bankAccountId } = validation.data
      if (!bankAccountId) return NextResponse.json({ error: 'bankAccountId obrigatório' }, { status: 400 })
      await deleteBankAccount(bankAccountId)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
