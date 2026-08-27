import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const userId = process.argv[2]
  if (!userId) {
    console.error('Usage: npx tsx scripts/dedup-transactions.ts <userId>')
    process.exit(1)
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: 'asc' },
    select: {
      id: true,
      description: true,
      amount: true,
      date: true,
      type: true,
      bankAccountId: true,
      pluggyId: true,
      createdAt: true,
    },
  })

  console.log(`Total transactions for user: ${transactions.length}`)

  const grouped = new Map<string, typeof transactions>()

  for (const tx of transactions) {
    const dateStr = tx.date.toISOString().split('T')[0]
    const key = [
      tx.description.trim().toLowerCase(),
      tx.amount.toString(),
      dateStr,
      tx.type,
    ].join('|')

    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(tx)
  }

  const duplicates: Array<{ keep: typeof transactions[0]; remove: typeof transactions[0] }> = []

  for (const [, group] of grouped) {
    if (group.length > 1) {
      const pluggyTxs = group.filter(t => t.pluggyId)
      const manualTxs = group.filter(t => !t.pluggyId)

      if (pluggyTxs.length > 0 && manualTxs.length > 0) {
        for (const manual of manualTxs) {
          duplicates.push({ keep: pluggyTxs[0], remove: manual })
        }
      } else if (pluggyTxs.length > 1) {
        for (let i = 1; i < pluggyTxs.length; i++) {
          duplicates.push({ keep: pluggyTxs[0], remove: pluggyTxs[i] })
        }
      } else if (manualTxs.length > 1) {
        for (let i = 1; i < manualTxs.length; i++) {
          duplicates.push({ keep: manualTxs[0], remove: manualTxs[i] })
        }
      }
    }
  }

  if (duplicates.length === 0) {
    console.log('No duplicates found!')
    await prisma.$disconnect()
    return
  }

  console.log(`\nFound ${duplicates.length} duplicate(s):`)
  for (const { keep, remove } of duplicates) {
    console.log(`  KEEP:    [${remove.date.toISOString().split('T')[0]}] ${remove.description} - R$ ${remove.amount} (${remove.pluggyId ?? 'manual'})`)
    console.log(`  REMOVE:  [${remove.date.toISOString().split('T')[0]}] ${remove.description} - R$ ${remove.amount} (${remove.pluggyId ?? 'manual'})`)
    console.log()
  }

  const removeIds = duplicates.map(d => d.remove.id)
  const result = await prisma.transaction.deleteMany({
    where: { id: { in: removeIds } },
  })

  console.log(`Removed ${result.count} duplicate transactions.`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
