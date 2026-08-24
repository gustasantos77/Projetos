const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const bank = await p.bankAccount.findFirst({ where: { name: { contains: 'Nu Pagamentos' } } })
  const r = await p.transaction.updateMany({
    where: { bankAccountId: 'cmt7ikuiy0003ezqpo43n6g61', description: { contains: 'Compra no débito' } },
    data: { bankAccountId: bank.id }
  })
  console.log('Movidos', r.count, 'débitos de volta para a conta')
}

main().catch(console.error).finally(() => p.$disconnect())
