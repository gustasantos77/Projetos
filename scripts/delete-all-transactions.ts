import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando exclusão de todas as transações...')
  
  const count = await prisma.transaction.deleteMany()
  
  console.log(`Sucesso! ${count.count} transações foram removidas.`)
}

main()
  .catch((e) => {
    console.error('Erro ao excluir transações:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
