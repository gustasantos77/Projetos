const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const NEW_CATEGORIES = [
  { name: 'Alimentação', type: 'EXPENSE', icon: 'UtensilsCrossed', color: '#EF4444' },
  { name: 'Transporte', type: 'EXPENSE', icon: 'Car', color: '#F97316' },
  { name: 'Lazer', type: 'EXPENSE', icon: 'Gamepad2', color: '#EC4899' },
  { name: 'Contas fixas', type: 'EXPENSE', icon: 'FileText', color: '#8B5CF6' },
  { name: 'Salário', type: 'INCOME', icon: 'Banknote', color: '#10B981' },
  { name: 'Outros', type: 'EXPENSE', icon: 'HelpCircle', color: '#64748B' },
];

(async () => {
  const users = await p.user.findMany();
  console.log(`${users.length} usuários encontrados`);

  for (const user of users) {
    // Remove old categories (but keep ones linked to transactions)
    const oldCategories = await p.category.findMany({ where: { userId: user.id } });
    for (const cat of oldCategories) {
      const txnCount = await p.transaction.count({ where: { categoryId: cat.id } });
      if (txnCount === 0) {
        await p.category.delete({ where: { id: cat.id } });
      } else {
        console.log(`  Mantendo "${cat.name}" (${txnCount} transações vinculadas)`);
      }
    }

    // Create new categories
    for (const cat of NEW_CATEGORIES) {
      const existing = await p.category.findFirst({ where: { userId: user.id, name: cat.name } });
      if (!existing) {
        await p.category.create({ data: { ...cat, userId: user.id } });
        console.log(`  Criada: ${cat.name} (${cat.type})`);
      }
    }
  }

  // Fix the existing transaction to have a category
  const user = await p.user.findFirst();
  if (user) {
    const alim = await p.category.findFirst({ where: { userId: user.id, name: 'Alimentação' } });
    const txns = await p.transaction.findMany({ where: { userId: user.id, categoryId: null } });
    for (const tx of txns) {
      await p.transaction.update({ where: { id: tx.id }, data: { categoryId: alim.id } });
      console.log(`  Transação "${tx.description}" categorizada como Alimentação`);
    }
  }

  console.log('Pronto!');
  await p.$disconnect();
})();
