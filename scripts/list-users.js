const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  console.log('Usuários encontrados:')
  users.forEach(u => console.log(`  - ${u.email} (${u.id})`))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
