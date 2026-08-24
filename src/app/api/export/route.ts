import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getTransactions } from '@/lib/finance-service'

export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth()
    const { searchParams } = new URL(req.url)

    const transactions = await getTransactions(userId, {
      month: searchParams.get('month') ? Number(searchParams.get('month')) : undefined,
      year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
      categoryId: searchParams.get('categoryId') ?? undefined,
      type: searchParams.get('type') ?? undefined,
    })

    const header = 'Data,Descrição,Tipo,Categoria,Valor,Conta\n'
    const rows = transactions.map(t => {
      const date = new Date(t.date).toLocaleDateString('pt-BR')
      const desc = `"${(t.description ?? '').replace(/"/g, '""')}"`
      const type = t.type === 'INCOME' ? 'Receita' : t.type === 'EXPENSE' ? 'Despesa' : 'Transferência'
      const category = `"${(t.category?.name ?? 'Sem categoria').replace(/"/g, '""')}"`
      const amount = Number(t.amount).toFixed(2).replace('.', ',')
      const account = `"${(t.bankAccount?.name ?? 'Manual').replace(/"/g, '""')}"`
      return `${date},${desc},${type},${category},${amount},${account}`
    }).join('\n')

    const csv = header + rows

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="transacoes_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
}
