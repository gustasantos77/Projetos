'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Wallet, Eye, EyeOff } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [validToken, setValidToken] = useState<boolean | null>(null)

  useEffect(() => {
    if (!token) {
      setValidToken(false)
    } else {
      setValidToken(true)
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('As senhas não conferem')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao redefinir senha')
        setLoading(false)
        return
      }

      router.push('/auth/signin?reset=true')
    } catch {
      setError('Erro ao conectar ao servidor')
      setLoading(false)
    }
  }

  if (validToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-8">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="p-3 bg-[var(--blue-600)] rounded-2xl">
              <Wallet size={28} className="text-white" />
            </div>
            <span className="text-2xl font-black text-[var(--blue-600)]">Finanças</span>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-[var(--border)]">
            <h2 className="text-xl font-black text-[var(--foreground)] mb-2">Link inválido</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              O link de redefinição de senha é inválido ou expirou.
            </p>
            <a href="/auth/forgot-password" className="mt-4 inline-block text-sm text-[var(--blue-600)] font-medium">
              Solicitar novo link
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-8">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="p-3 bg-[var(--blue-600)] rounded-2xl">
            <Wallet size={28} className="text-white" />
          </div>
          <span className="text-2xl font-black text-[var(--blue-600)]">Finanças</span>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-[var(--border)]">
          <h2 className="text-xl font-black text-[var(--foreground)] mb-2">
            Redefinir senha
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            Informe sua nova senha abaixo.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)] focus:border-transparent transition-all"
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Confirmar Senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)] focus:border-transparent transition-all"
                placeholder="Repita a senha"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--blue-600)] text-white rounded-xl text-sm font-bold hover:bg-[var(--blue-700)] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Redefinindo...' : 'Redefinir senha'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/auth/signin" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              Voltar para o login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--blue-600)]" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
