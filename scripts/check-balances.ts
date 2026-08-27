import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const envContent = readFileSync(resolve(__dirname, '../.env.local'), 'utf-8')
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
}

const prisma = new PrismaClient()

const CLIENT_ID = process.env.PLUGGY_CLIENT_ID
const CLIENT_SECRET = process.env.PLUGGY_CLIENT_SECRET
const BASE = process.env.PLUGGY_BASE_URL || 'https://api.pluggy.ai'

async function getApiKey() {
  const res = await fetch(`${BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET }),
  })
  const data = await res.json()
  return data.apiKey
}

async function pluggyFetch(endpoint: string, apiKey: string) {
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
  })
  return res.json()
}

async function main() {
  const accounts = await prisma.bankAccount.findMany({
    where: { userId: 'cmt3a1dov0000vfhayr9cm5hq' },
    select: { id: true, name: true, type: true, balance: true, pluggyAccountId: true, pluggyItemId: true }
  })

  console.log('=== Contas no banco ===')
  for (const a of accounts) {
    console.log(`  ${a.name} | ${a.type} | saldo DB: ${a.balance}`)
  }

  const apiKey = await getApiKey()
  const items = [...new Set(accounts.map(a => a.pluggyItemId))]

  console.log('\n=== Saldos da Pluggy ===')
  let totalPluggy = 0
  for (const itemId of items) {
    const pa = await pluggyFetch(`/accounts?itemId=${itemId}`, apiKey)
    console.log('Pluggy response:', JSON.stringify(pa).substring(0, 500))
    for (const acc of (pa.results ?? [])) {
      const dbAccount = accounts.find(a => a.pluggyAccountId === acc.id)
      const pluggyBal = Number(acc.balance ?? 0)
      const dbBal = dbAccount ? Number(dbAccount.balance) : 0
      totalPluggy += pluggyBal
      console.log(`  ${acc.name ?? acc.description ?? '??'} | Pluggy: ${pluggyBal} | DB: ${dbBal} | diff: ${pluggyBal - dbBal}`)
    }
  }

  console.log(`\n  TOTAL Pluggy: ${totalPluggy}`)
  console.log(`  TOTAL DB:     ${accounts.reduce((s, a) => s + Number(a.balance), 0)}`)

  // Future transactions
  const now = new Date()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const futureTx = await prisma.transaction.findMany({
    where: { userId: 'cmt3a1dov0000vfhayr9cm5hq', date: { gt: endOfMonth } },
    select: { amount: true, type: true, description: true, date: true },
  })

  const futureNet = futureTx.reduce((sum, t) => {
    if (t.type === 'INCOME') return sum + Number(t.amount)
    if (t.type === 'EXPENSE') return sum - Number(t.amount)
    return sum
  }, 0)

  console.log(`\n=== Transações futuras (${futureTx.length}) ===`)
  for (const t of futureTx) {
    console.log(`  ${t.date.toISOString().split('T')[0]} | ${t.type} | R$ ${t.amount} | ${t.description}`)
  }
  console.log(`  Efeito líquido: ${futureNet}`)
  console.log(`  Balanço Geral = ${totalPluggy} + ${futureNet} = ${totalPluggy + futureNet}`)
}

main().then(() => prisma.$disconnect())
