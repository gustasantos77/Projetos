import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getRecurring, createRecurring, updateRecurring, deleteRecurring } from '@/lib/finance-service'
import { validateRequest, createRecurringSchema } from '@/lib/validations'

export async function GET() {
  try {
    const userId = await requireAuth()
    const recurring = await getRecurring(userId)
    return NextResponse.json(recurring)
  } catch {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth()
    const body = await req.json()

    const validation = validateRequest(createRecurringSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
    }

    const recurring = await createRecurring(userId, validation.data)
    return NextResponse.json(recurring)
  } catch {
    return NextResponse.json({ error: 'Erro ao criar recorrência' }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAuth()
    const body = await req.json()
    const { id, ...data } = body
    const recurring = await updateRecurring(id, data)
    return NextResponse.json(recurring)
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar recorrência' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
    await deleteRecurring(id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao deletar recorrência' }, { status: 400 })
  }
}
