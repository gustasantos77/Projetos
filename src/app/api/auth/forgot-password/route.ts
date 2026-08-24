import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })

    if (!user) {
      return NextResponse.json({
        message: 'Se o email estiver cadastrado, você receberá um link de redefinição'
      })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    console.log(`[PASSWORD RESET] Token para ${email}: ${token}`)
    console.log(`[PASSWORD RESET] Link: http://localhost:3001/auth/reset-password/${token}`)

    return NextResponse.json({
      message: 'Se o email estiver cadastrado, você receberá um link de redefinição'
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao processar solicitação' }, { status: 500 })
  }
}
