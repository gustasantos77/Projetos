const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const cat = await p.category.findFirst({ where: { name: 'Alimentação' } });
  const txn = await p.transaction.update({
    where: { id: 'cmt38ln3v0004472ma7vf45et' },
    data: { categoryId: cat.id }
  });
  console.log('Updated:', txn.id, txn.description, txn.categoryId);
  await p.$disconnect();
})();
