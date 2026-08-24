import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getBudgets, createBudget, deleteBudget } from '@/lib/finance-service'
import { validateRequest, createBudgetSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth()
    const { searchParams } = new URL(req.url)
    const budgets = await getBudgets(userId,
      searchParams.get('month') ? Number(searchParams.get('month')) : undefined,
      searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
    )
    return NextResponse.json(budgets)
  } catch {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth()
    const body = await req.json()

    const validation = validateRequest(createBudgetSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
    }

    const budget = await createBudget(userId, validation.data)
    return NextResponse.json(budget)
  } catch {
    return NextResponse.json({ error: 'Erro ao criar orçamento' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
    await deleteBudget(id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao deletar orçamento' }, { status: 400 })
  }
}
