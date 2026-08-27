import { PrismaClient } from '@prisma/client'
import { getBankAccounts } from './finance-service'
import { getTransactions } from './pluggy'

function parseTxDate(tx: Record<string, unknown>): Date {
  const rawDate = tx.dateTime ?? tx.date ?? tx.postDate
  if (rawDate != null && rawDate !== '') {
    const parsed = Date.parse(String(rawDate))
    if (!isNaN(parsed)) return new Date(parsed)
  }
  return new Date()
}

async function upsertTransaction(
  prisma: PrismaClient,
  tx: Record<string, unknown>,
  bankAccountId: string,
  userId: string,
  isCreditCard: boolean,
) {
  const pluggyId = tx.id as string | undefined
  if (!pluggyId) return false

  const amount = Number(tx.amount ?? 0)
  const type = isCreditCard
    ? amount >= 0 ? 'EXPENSE' : 'INCOME'
    : tx.type === 'CREDIT' ? 'INCOME' : 'EXPENSE'
  const txDate = parseTxDate(tx)
  const desc = (tx.description ?? tx.descriptionRaw ?? 'Transação bancária') as string
  const amt = Math.abs(amount)

  const dateStr = txDate.toISOString().split('T')[0]

  const existing = await prisma.transaction.findFirst({
    where: {
      userId,
      pluggyId,
    },
  })

  if (existing) {
    await prisma.transaction.update({
      where: { id: existing.id },
      data: {
        description: desc,
        amount: amt,
        type,
        date: txDate,
        bankAccountId,
      },
    })
    return false
  }

  const duplicate = await prisma.transaction.findFirst({
    where: {
      userId,
      description: desc,
      amount: amt,
      type,
      date: {
        gte: new Date(dateStr + 'T00:00:00.000Z'),
        lte: new Date(dateStr + 'T23:59:59.999Z'),
      },
    },
  })

  if (duplicate) {
    await prisma.transaction.update({
      where: { id: duplicate.id },
      data: {
        pluggyId,
        bankAccountId,
      },
    })
    return false
  }

  await prisma.transaction.create({
    data: {
      userId,
      bankAccountId,
      pluggyId,
      description: desc,
      amount: amt,
      type,
      date: txDate,
    },
  })
  return true
}

export async function syncTransactionsForUser(userId: string): Promise<number> {
  const { prisma } = await import('./prisma')
  const bankAccounts = await getBankAccounts(userId)
  let imported = 0

  for (const account of bankAccounts) {
    if (!account.pluggyAccountId) continue

    const transactions = await getTransactions(account.pluggyAccountId)
    const isCreditCard = String(account.type).toUpperCase().includes('CREDIT')

    for (const tx of transactions.results) {
      const created = await upsertTransaction(prisma, tx as Record<string, unknown>, account.id, userId, isCreditCard)
      if (created) imported++
    }

    await prisma.bankAccount.update({
      where: { id: account.id },
      data: { lastSyncAt: new Date() },
    })
  }

  return imported
}

export async function syncTransactionsByItemId(itemId: string): Promise<number> {
  const { prisma } = await import('./prisma')
  const accounts = await prisma.bankAccount.findMany({
    where: { pluggyItemId: itemId },
  })

  let imported = 0
  for (const account of accounts) {
    if (!account.pluggyAccountId) continue

    const transactions = await getTransactions(account.pluggyAccountId)
    const isCreditCard = String(account.type).toUpperCase().includes('CREDIT')

    for (const tx of transactions.results) {
      const created = await upsertTransaction(prisma, tx as Record<string, unknown>, account.id, account.userId, isCreditCard)
      if (created) imported++
    }

    await prisma.bankAccount.update({
      where: { id: account.id },
      data: { lastSyncAt: new Date() },
    })
  }

  return imported
}
