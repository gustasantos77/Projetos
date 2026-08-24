const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const transactions = await prisma.transaction.findMany({
    select: { id: true, date: true }
  })
  
  let fixed = 0
  for (const tx of transactions) {
    const date = new Date(tx.date)
    const hours = date.getUTCHours()
    
    if (hours === 0 || hours === 3) {
      const newDate = new Date(date)
      newDate.setUTCHours(12, 0, 0, 0)
      await prisma.transaction.update({
        where: { id: tx.id },
        data: { date: newDate }
      })
      fixed++
    }
  }
  
  console.log(`Corrigidas ${fixed} transações`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
