import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_CATEGORIES = [
  { name: 'Alimentação', type: 'EXPENSE', icon: 'UtensilsCrossed', color: '#EF4444' },
  { name: 'Transporte', type: 'EXPENSE', icon: 'Car', color: '#F97316' },
  { name: 'Lazer', type: 'EXPENSE', icon: 'Gamepad2', color: '#EC4899' },
  { name: 'Contas fixas', type: 'EXPENSE', icon: 'FileText', color: '#8B5CF6' },
  { name: 'Salário', type: 'INCOME', icon: 'Banknote', color: '#10B981' },
  { name: 'Outros', type: 'EXPENSE', icon: 'HelpCircle', color: '#64748B' },
]

async function main() {
  const email = 'admin@financas.com'

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Admin',
      passwordHash: '$2b$10$placeholder_hash_change_on_first_login',
    },
  })

  console.log(`Usuário padrão: ${email} (id: ${user.id})`)

  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { userId: user.id, name: cat.name, type: cat.type },
    })
    if (!existing) {
      await prisma.category.create({
        data: { ...cat, userId: user.id },
      })
    }
  }

  console.log(`${DEFAULT_CATEGORIES.length} categorias padrão criadas/verificadas`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
