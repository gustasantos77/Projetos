import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@financas.com'
  const newPassword = 'admin123'

  const passwordHash = await bcrypt.hash(newPassword, 12)

  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash },
  })

  console.log(`Senha atualizada com sucesso!`)
  console.log(`Email: ${email}`)
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
