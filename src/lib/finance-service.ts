import { prisma } from './prisma'

// === BANK ACCOUNTS ===
export async function getBankAccounts(userId: string) {
  return prisma.bankAccount.findMany({
    where: { userId },
    include: { transactions: { orderBy: { date: 'desc' }, take: 1 } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createBankAccount(userId: string, data: {
  name: string
  type: string
  institution: string
  pluggyItemId: string
  pluggyAccountId?: string
  balance?: number
}) {
  return prisma.bankAccount.create({
    data: { ...data, userId, balance: data.balance ?? 0 },
  })
}

export async function deleteBankAccount(id: string) {
  return prisma.bankAccount.delete({ where: { id } })
}

// === CATEGORIES ===
export async function getCategories(userId: string, type?: string) {
  const where: Record<string, unknown> = { userId }
  if (type) where.type = type
  return prisma.category.findMany({ where, orderBy: { name: 'asc' } })
}

export async function createCategory(userId: string, data: {
  name: string
  type: string
  icon?: string
  color?: string
}) {
  return prisma.category.create({ data: { ...data, userId } })
}

export async function updateCategory(id: string, data: {
  name?: string
  icon?: string
  color?: string
  rules?: string
}) {
  return prisma.category.update({ where: { id }, data })
}

export async function deleteCategory(id: string) {
  return prisma.category.delete({ where: { id } })
}

// === TRANSACTIONS ===
export async function getTransactions(userId: string, filters?: {
  month?: number
  year?: number
  categoryId?: string
  type?: string
  bankAccountId?: string
  search?: string
}) {
  const where: Record<string, unknown> = { userId }

  if (filters?.type) where.type = filters.type
  if (filters?.categoryId) where.categoryId = filters.categoryId
  if (filters?.bankAccountId) where.bankAccountId = filters.bankAccountId
  if (filters?.search) {
    where.description = { contains: filters.search, mode: 'insensitive' }
  }
  if (filters?.month && filters?.year) {
    const start = new Date(filters.year, filters.month - 1, 1)
    const end = new Date(filters.year, filters.month, 0, 23, 59, 59)
    where.date = { gte: start, lte: end }
  }

  return prisma.transaction.findMany({
    where,
    include: { category: true, bankAccount: true },
    orderBy: { date: 'desc' },
  })
}

export async function createTransaction(userId: string, data: {
  bankAccountId?: string
  description: string
  amount: number
  type: string
  date: Date
  categoryId?: string
  isRecurring?: boolean
  recurringId?: string
  notes?: string
}) {
  return prisma.transaction.create({
    data: { ...data, userId, amount: data.amount },
    include: { category: true, bankAccount: true },
  })
}

export async function updateTransaction(id: string, data: {
  description?: string
  amount?: number
  type?: string
  categoryId?: string
  notes?: string
}) {
  return prisma.transaction.update({
    where: { id },
    data,
    include: { category: true },
  })
}

export async function deleteTransaction(id: string) {
  return prisma.transaction.delete({ where: { id } })
}

// === BUDGETS ===
export async function getBudgets(userId: string, month?: number, year?: number) {
  const now = new Date()
  const m = month ?? now.getMonth() + 1
  const y = year ?? now.getFullYear()

  return prisma.budget.findMany({
    where: { userId, month: m, year: y },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createBudget(userId: string, data: {
  categoryId: string
  amount: number
  month: number
  year: number
}) {
  return prisma.budget.upsert({
    where: {
      userId_categoryId_month_year: {
        userId,
        categoryId: data.categoryId,
        month: data.month,
        year: data.year,
      },
    },
    update: { amount: data.amount },
    create: { ...data, userId, amount: data.amount },
    include: { category: true },
  })
}

export async function deleteBudget(id: string) {
  return prisma.budget.delete({ where: { id } })
}

// === RECURRING ===
export async function getRecurring(userId: string) {
  return prisma.recurring.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createRecurring(userId: string, data: {
  description: string
  amount: number
  type?: string
  frequency?: string
  dayOfMonth?: number
  categoryId?: string
}) {
  return prisma.recurring.create({
    data: { ...data, userId },
    include: { category: true },
  })
}

export async function updateRecurring(id: string, data: {
  description?: string
  amount?: number
  isActive?: boolean
  categoryId?: string
}) {
  return prisma.recurring.update({ where: { id }, data, include: { category: true } })
}

export async function deleteRecurring(id: string) {
  return prisma.recurring.delete({ where: { id } })
}

// === DASHBOARD STATS ===
export async function getDashboardStats(userId: string, month?: number, year?: number) {
  const now = new Date()
  const m = month ?? now.getMonth() + 1
  const y = year ?? now.getFullYear()
  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 0, 23, 59, 59)

  const [accounts, monthTransactions, budgets] = await Promise.all([
    prisma.bankAccount.findMany({ where: { userId } }),
    prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
      include: { category: true },
    }),
    prisma.budget.findMany({
      where: { userId, month: m, year: y },
      include: { category: true },
    }),
  ])

  const currentTotalBalance = accounts
    .filter(acc => !String(acc.type).toUpperCase().includes('CREDIT'))
    .reduce((sum, acc) => sum + Number(acc.balance ?? 0), 0)

  const futureTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gt: end },
    },
    select: { amount: true, type: true },
  })

  const futureNetEffect = futureTransactions.reduce((sum, t) => {
    if (t.type === 'INCOME') return sum - Number(t.amount)
    if (t.type === 'EXPENSE') return sum + Number(t.amount)
    return sum
  }, 0)

  const totalBalance = currentTotalBalance + futureNetEffect
  const totalIncome = monthTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const totalExpenses = monthTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  // Budget usage
  const budgetsWithUsage = budgets.map(b => {
    const spent = monthTransactions
      .filter(t => t.type === 'EXPENSE' && t.categoryId === b.categoryId)
      .reduce((sum, t) => sum + Number(t.amount), 0)
    return {
      ...b,
      spent,
      remaining: Number(b.amount) - spent,
      usagePercent: Number(b.amount) > 0 ? (spent / Number(b.amount)) * 100 : 0,
    }
  })

  // Expense by category
  const expensesByCategory = monthTransactions
    .filter(t => t.type === 'EXPENSE' && t.category)
    .reduce((acc, t) => {
      const catName = t.category?.name ?? 'Sem categoria'
      const existing = acc.find(a => a.name === catName)
      if (existing) {
        existing.amount += Number(t.amount)
      } else {
        acc.push({
          name: catName,
          amount: Number(t.amount),
          color: t.category?.color ?? '#6b7280',
        })
      }
      return acc
    }, [] as Array<{ name: string; amount: number; color: string }>)
    .sort((a, b) => b.amount - a.amount)

  // Recent transactions
  const recentTransactions = monthTransactions.slice(0, 10)

  return {
    totalBalance,
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    accounts,
    budgetsWithUsage,
    expensesByCategory,
    recentTransactions,
    transactionCount: monthTransactions.length,
  }
}
