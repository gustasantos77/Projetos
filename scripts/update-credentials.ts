import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const newEmail = 'gustavo@lima.com'
  const newPassword = 'F!n@nc4s#2026'
  const oldEmail = 'admin@financas.com'

  const passwordHash = await bcrypt.hash(newPassword, 12)

  const existing = await prisma.user.findUnique({ where: { email: newEmail } })

  if (existing) {
    await prisma.user.update({
      where: { email: newEmail },
      data: { passwordHash },
    })
    console.log(`Senha do usuário ${newEmail} atualizada!`)
  } else {
    await prisma.user.update({
      where: { email: oldEmail },
      data: { email: newEmail, passwordHash },
    })
    console.log(`Usuário alterado de ${oldEmail} para ${newEmail}`)
  }

  console.log(`\nNovos dados de login:`)
  console.log(`Email: ${newEmail}`)
  console.log(`Senha: ${newPassword}`)
}

main()
  .catch((e) => {
    console.error('Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
