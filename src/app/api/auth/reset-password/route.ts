import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token e senha são obrigatórios' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Senha deve ter pelo menos 8 caracteres' }, { status: 400 })
    }

    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetRecord) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    }

    if (resetRecord.used) {
      return NextResponse.json({ error: 'Token já utilizado' }, { status: 400 })
    }

    if (new Date() > resetRecord.expiresAt) {
      return NextResponse.json({ error: 'Token expirado' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    })

    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true },
    })

    return NextResponse.json({ message: 'Senha redefinida com sucesso' })
  } catch {
    return NextResponse.json({ error: 'Erro ao redefinir senha' }, { status: 500 })
  }
}
