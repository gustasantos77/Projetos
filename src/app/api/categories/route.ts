import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/finance-service'
import { validateRequest, createCategorySchema, updateCategorySchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth()
    const { searchParams } = new URL(req.url)
    const categories = await getCategories(userId, searchParams.get('type') ?? undefined)
    return NextResponse.json(categories)
  } catch {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth()
    const body = await req.json()

    const validation = validateRequest(createCategorySchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
    }

    const category = await createCategory(userId, validation.data)
    return NextResponse.json(category)
  } catch {
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAuth()
    const body = await req.json()

    const validation = validateRequest(updateCategorySchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
    }

    const { id, ...data } = validation.data
    const category = await updateCategory(id, data)
    return NextResponse.json(category)
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
    await deleteCategory(id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao deletar categoria' }, { status: 400 })
  }
}
