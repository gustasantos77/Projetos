const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const cats = await p.category.findMany();
  console.log('Categories:', cats.length);
  cats.forEach(c => console.log(c.id, c.name, c.type));

  const txns = await p.transaction.findMany({ include: { category: true } });
  console.log('\nTransactions:', txns.length);
  txns.forEach(t => console.log(t.id, t.date, t.amount, t.type, t.description, t.categoryId));

  const users = await p.user.findMany();
  console.log('\nUsers:', users.length);
  users.forEach(u => console.log(u.id, u.email));

  await p.$disconnect();
})();
