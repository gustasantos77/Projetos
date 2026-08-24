import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { validateRequest, signupSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const validation = validateRequest(signupSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
    }

    const { name, email, password } = validation.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true },
    })

    return NextResponse.json({ user, message: 'Conta criada com sucesso' }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 })
  }
}
