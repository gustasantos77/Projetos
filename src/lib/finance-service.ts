import { prisma } from './prisma'

// === BANK ACCOUNTS ===
export async function getBankAccounts(userId: string, month?: number, year?: number) {
  const accounts = await prisma.bankAccount.findMany({
    where: { userId },
    include: { transactions: true },
    orderBy: { createdAt: 'desc' },
  })

  return accounts.map(acc => {
    let filteredTransactions = acc.transactions
    if (month && year) {
      const start = new Date(year, month - 1, 1)
      const end = new Date(year, month, 0, 23, 59, 59)
      filteredTransactions = acc.transactions.filter(tx => {
        const txDate = new Date(tx.date)
        return txDate >= start && txDate <= end
      })
    }
    const computedBalance = filteredTransactions.reduce((sum, tx) => {
      if (tx.type === 'INCOME') return sum + Number(tx.amount)
      if (tx.type === 'EXPENSE') return sum - Number(tx.amount)
      return sum
    }, 0)
    return { ...acc, balance: computedBalance }
  })
}

export async function createBankAccount(userId: string, data: {
  name: string
  type: string
  institution: string
  pluggyItemId?: string | null
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
  status?: string
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
  isRecurring?: boolean
}) {
  // If marking as recurring, create a Recurring entry if it doesn't have one
  if (data.isRecurring) {
    const transaction = await prisma.transaction.findUnique({ where: { id } })
    if (transaction && !transaction.recurringId) {
      const recurring = await prisma.recurring.create({
        data: {
          userId: transaction.userId,
          description: transaction.description,
          amount: Number(transaction.amount),
          type: transaction.type,
          frequency: 'MONTHLY',
          categoryId: transaction.categoryId,
          isActive: true,
        },
      })
      await prisma.transaction.update({
        where: { id },
        data: { ...data, recurringId: recurring.id },
        include: { category: true },
      })
      return prisma.transaction.findUnique({
        where: { id },
        include: { category: true },
      })
    }
  }

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

// === PENDING RECURRING TRANSACTIONS ===
export async function getUnpaidRecurring(userId: string, month: number, year: number) {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59)

  const activeRecurring = await prisma.recurring.findMany({
    where: { userId, isActive: true },
    include: { category: true },
  })

  const unpaid = []

  for (const rec of activeRecurring) {
    const paidTransaction = await prisma.transaction.findFirst({
      where: {
        userId,
        recurringId: rec.id,
        status: 'PAID',
        date: { gte: start, lte: end },
      },
    })

    if (!paidTransaction) {
      const expectedDate = rec.dayOfMonth
        ? new Date(year, month - 1, Math.min(rec.dayOfMonth, new Date(year, month, 0).getDate()))
        : new Date(year, month - 1, 1)

      unpaid.push({
        id: `unpaid_${rec.id}_${month}_${year}`,
        description: rec.description,
        amount: Number(rec.amount),
        type: rec.type,
        date: `${year}-${String(month).padStart(2, '0')}-${String(rec.dayOfMonth ?? 1).padStart(2, '0')}`,
        status: 'PENDING',
        isRecurring: true,
        recurringId: rec.id,
        categoryId: rec.categoryId,
        category: rec.category,
        bankAccount: null,
      })
    }
  }

  return unpaid
}

export async function markTransactionAsPaid(id: string) {
  return prisma.transaction.update({
    where: { id },
    data: { status: 'PAID' },
    include: { category: true, bankAccount: true },
  })
}

export async function markTransactionAsPending(id: string) {
  return prisma.transaction.update({
    where: { id },
    data: { status: 'PENDING' },
    include: { category: true, bankAccount: true },
  })
}

// === INSTALLMENTS ===
export async function createInstallmentTransaction(userId: string, data: {
  description: string
  amount: number
  type: string
  date: Date
  categoryId?: string
  bankAccountId?: string
  notes?: string
  totalInstallments: number
}) {
  const installmentGroupId = `installment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const installmentAmount = data.amount // Each installment is the full amount

  const transactions = []

  for (let i = 1; i <= data.totalInstallments; i++) {
    const installmentDate = new Date(data.date)
    installmentDate.setMonth(installmentDate.getMonth() + (i - 1))

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        description: `${data.description} (${i}/${data.totalInstallments})`,
        amount: installmentAmount,
        type: data.type,
        date: installmentDate,
        categoryId: data.categoryId,
        bankAccountId: data.bankAccountId,
        notes: data.notes,
        status: 'PENDING',
        totalInstallments: data.totalInstallments,
        currentInstallment: i,
        installmentGroupId,
      },
      include: { category: true, bankAccount: true },
    })
    transactions.push(transaction)
  }

  return transactions
}

export async function getInstallmentTransactions(userId: string, installmentGroupId: string) {
  return prisma.transaction.findMany({
    where: { userId, installmentGroupId },
    include: { category: true, bankAccount: true },
    orderBy: { currentInstallment: 'asc' },
  })
}

// === DASHBOARD STATS ===
export async function getDashboardStats(userId: string, month?: number, year?: number) {
  const now = new Date()
  const m = month ?? now.getMonth() + 1
  const y = year ?? now.getFullYear()
  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 0, 23, 59, 59)

  // Get unpaid recurring transactions (dynamically calculated)
  const unpaidRecurring = await getUnpaidRecurring(userId, m, y)

  const [accounts, monthTransactions, budgets] = await Promise.all([
    getBankAccounts(userId, m, y),
    prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
      include: { category: true, bankAccount: true },
    }),
    prisma.budget.findMany({
      where: { userId, month: m, year: y },
      include: { category: true },
    }),
  ])

  const currentTotalBalance = monthTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0)
    - monthTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalBalance = currentTotalBalance
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

  // Pending transactions (unpaid recurring expenses)
  const pendingTransactions = unpaidRecurring

  return {
    totalBalance,
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    accounts,
    budgetsWithUsage,
    expensesByCategory,
    recentTransactions,
    pendingTransactions,
    transactionCount: monthTransactions.length,
    pendingCount: pendingTransactions.length,
  }
}
