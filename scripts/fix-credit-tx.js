const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const creditCard = await prisma.bankAccount.findFirst({ where: { name: 'gold' } })
  const bankAccount = await prisma.bankAccount.findFirst({ where: { name: { contains: 'Nu Pagamentos' } } })

  if (!creditCard || !bankAccount) {
    console.log('Contas não encontradas')
    return
  }

  // 1. Mover "Compra no débito" para o cartão
  const debitTxs = await prisma.transaction.findMany({
    where: {
      bankAccountId: bankAccount.id,
      description: { contains: 'Compra no débito' }
    }
  })
  console.log(`Débitos encontrados: ${debitTxs.length}`)

  let movedDebit = 0
  for (const tx of debitTxs) {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { bankAccountId: creditCard.id }
    })
    movedDebit++
  }
  console.log(`Movidos ${movedDebit} débitos para o cartão`)

  // 2. Mover "Compra no crédito" para o cartão (se houver)
  const creditTxs = await prisma.transaction.findMany({
    where: {
      bankAccountId: bankAccount.id,
      description: { contains: 'Compra no crédito' }
    }
  })
  console.log(`Créditos encontrados: ${creditTxs.length}`)

  let movedCredit = 0
  for (const tx of creditTxs) {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { bankAccountId: creditCard.id }
    })
    movedCredit++
  }
  console.log(`Movidos ${movedCredit} créditos para o cartão`)

  // 3. Deletar "Crédito de atraso" que tem par "Saldo em atraso" no mesmo valor/data
  const atrasoPairs = await prisma.transaction.findMany({
    where: {
      bankAccountId: creditCard.id,
      description: { contains: 'Crédito de atraso' },
      type: 'INCOME'
    }
  })

  let deletedPairs = 0
  for (const income of atrasoPairs) {
    const matchingExpense = await prisma.transaction.findFirst({
      where: {
        bankAccountId: creditCard.id,
        description: { contains: 'Saldo em atraso' },
        type: 'EXPENSE',
        amount: income.amount,
        date: income.date,
      }
    })
    if (matchingExpense) {
      await prisma.transaction.delete({ where: { id: income.id } })
      deletedPairs++
    }
  }
  console.log(`Deletados ${deletedPairs} pares de atraso duplicados`)

  // 4. Resultado final
  const card = await prisma.bankAccount.findUnique({ where: { id: creditCard.id }, include: { _count: { select: { transactions: true } } } })
  const bank = await prisma.bankAccount.findUnique({ where: { id: bankAccount.id }, include: { _count: { select: { transactions: true } } } })
  console.log(`\nResultado:`)
  console.log(`${card.name} (cartão): ${card._count.transactions} transações`)
  console.log(`${bank.name} (conta): ${bank._count.transactions} transações`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
