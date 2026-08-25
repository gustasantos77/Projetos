'use client'

import { useState } from 'react'
import { Wallet, ArrowLeft } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao processar solicitação')
        setLoading(false)
        return
      }

      setSent(true)
    } catch {
      setError('Erro ao conectar ao servidor')
      setLoading(false)
    }
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

        <div className="bg-[var(--card)] p-8 rounded-2xl border border-[var(--border)]">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--muted)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--green-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-[var(--foreground)] mb-2">Email enviado!</h2>
              <p className="text-sm text-[var(--muted-foreground)] mb-6">
                Se o email estiver cadastrado, você receberá um link para redefinir sua senha.
              </p>
              <a
                href="/auth/signin"
                className="inline-flex items-center gap-2 text-sm text-[var(--blue-600)] font-medium hover:text-[var(--blue-700)]"
              >
                <ArrowLeft size={16} />
                Voltar para o login
              </a>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-black text-[var(--foreground)] mb-2">
                Esqueceu a senha?
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mb-6">
                Informe seu email para receber um link de redefinição de senha.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)] focus:border-transparent transition-all"
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-[var(--muted)] border border-red-200 rounded-xl text-sm text-red-500">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[var(--blue-600)] text-white rounded-xl text-sm font-bold hover:bg-[var(--blue-700)] disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Enviando...' : 'Enviar link de redefinição'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <a
                  href="/auth/signin"
                  className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  <ArrowLeft size={16} />
                  Voltar para o login
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
