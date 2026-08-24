import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '@/lib/finance-service'
import { validateRequest, createTransactionSchema, updateTransactionSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth()
    const { searchParams } = new URL(req.url)

    const transactions = await getTransactions(userId, {
      month: searchParams.get('month') ? Number(searchParams.get('month')) : undefined,
      year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
      categoryId: searchParams.get('categoryId') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      bankAccountId: searchParams.get('bankAccountId') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    })

    return NextResponse.json(transactions)
  } catch {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth()
    const body = await req.json()

    const validation = validateRequest(createTransactionSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
    }

    const transaction = await createTransaction(userId, {
      ...validation.data,
      date: new Date(validation.data.date),
    })

    return NextResponse.json(transaction)
  } catch {
    return NextResponse.json({ error: 'Erro ao criar transação' }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAuth()
    const body = await req.json()

    const validation = validateRequest(updateTransactionSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
    }

    const { id, ...data } = validation.data
    const updateData = {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    }
    const transaction = await updateTransaction(id, updateData)
    return NextResponse.json(transaction)
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar transação' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    await deleteTransaction(id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao deletar transação' }, { status: 400 })
  }
}
