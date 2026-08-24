const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const creditCard = await prisma.bankAccount.findFirst({ where: { name: 'gold' } })
  const bankAccount = await prisma.bankAccount.findFirst({ where: { name: { contains: 'Nu Pagamentos' } } })
  
  if (!creditCard || !bankAccount) {
    console.log('Contas não encontradas')
    return
  }
  
  const creditPatterns = [
    'Compra no crédito',
    'Parcela',
    'Fatura',
    'Valor adicionado na conta por cartão de crédito',
    'Pagamento de fatura',
  ]
  
  const allTransactions = await prisma.transaction.findMany({
    where: { bankAccountId: bankAccount.id }
  })
  
  const creditTransactions = allTransactions.filter(t => 
    creditPatterns.some(p => t.description.includes(p))
  )
  
  console.log(`Encontradas ${creditTransactions.length} transações de cartão de crédito`)
  
  let moved = 0
  for (const tx of creditTransactions) {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { bankAccountId: creditCard.id }
    })
    moved++
  }
  
  console.log(`Movidas ${moved} transações para o cartão gold`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
