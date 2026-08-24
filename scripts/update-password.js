const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = 'gustavo@lima.com'
  const newPassword = process.argv[2]
  
  if (!newPassword) {
    console.error('Uso: npx tsx scripts/update-password.js <nova-senha>')
    process.exit(1)
  }
  
  const passwordHash = await bcrypt.hash(newPassword, 12)
  
  await prisma.user.update({
    where: { email },
    data: { passwordHash }
  })
  
  console.log(`Senha atualizada para: ${email}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
