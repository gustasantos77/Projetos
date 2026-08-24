const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = 'gustavo@lima.com'
  const newPassword = 'F!n@nc4s#2026'
  
  const passwordHash = await bcrypt.hash(newPassword, 12)
  
  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash }
  })
  
  console.log(`Senha atualizada para: ${email}`)
  console.log(`Nova senha: ${newPassword}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
