'use client'

import { useState, useEffect } from 'react'
import { Landmark, Trash2, RefreshCw, Plug } from 'lucide-react'

declare global {
  interface Window {
    PluggyConnect?: new (config: {
      connectToken: string
      onSuccess: (data: { item?: { id?: string } }) => void | Promise<void>
      onError: (error: { message?: string }) => void
      onClose?: () => void
    }) => {
      init: () => Promise<void> | void
    }
  }
}

interface BankAccount {
  id: string
  name: string
  institution: string
  type: string
  balance: number | null
  lastSyncAt: string | null
}

const INSTITUTION_COLORS: Record<string, string> = {
  'Nubank': '#820AD1',
  'Itaú': '#EC7000',
  'Inter': '#FF7A00',
  'PicPay': '#22c55e',
  'Banco do Brasil': '#2563eb',
}

function getTimeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'agora'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `há ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

export default function SettingsPanel() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sync')
      const data = await res.json().catch(() => null)
      if (res.ok) {
        setAccounts(data)
      } else {
        setError(data?.error ?? 'Não foi possível carregar as contas conectadas.')
      }
    } catch (accountsError) {
      setError((accountsError as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAccounts() }, [])

  const loadPluggyConnect = () => new Promise<void>((resolve, reject) => {
    if (window.PluggyConnect) {
      resolve()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-pluggy-connect]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Não foi possível carregar a Pluggy')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.pluggy.ai/pluggy-connect/latest/pluggy-connect.js'
    script.async = true
    script.dataset.pluggyConnect = 'true'
    script.crossOrigin = 'anonymous'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Não foi possível carregar a Pluggy'))
    document.body.appendChild(script)
  })

  const handleConnect = async () => {
    setConnecting(true)
    setError(null)
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect' }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? 'Não foi possível iniciar a conexão bancária')
      }
      if (!data.token) throw new Error('Token da Pluggy não retornado')

      await loadPluggyConnect()
      if (!window.PluggyConnect) throw new Error('Widget da Pluggy indisponível')

      const pluggyConnect = new window.PluggyConnect({
        connectToken: data.token,
        onSuccess: async ({ item }) => {
          const itemId = item?.id
          if (!itemId) {
            setError('A Pluggy conectou, mas não retornou o identificador da conta.')
            return
          }

          const addRes = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add', itemId }),
          })
          const addData = await addRes.json().catch(() => ({}))
          if (!addRes.ok) {
            setError(addData.error ?? 'Conta conectada, mas não foi possível salvar no app.')
            return
          }
          await fetchAccounts()
        },
        onError: (pluggyError) => {
          setError(pluggyError.message ?? 'A conexão bancária não foi concluída.')
        },
        onClose: () => setConnecting(false),
      })

      await pluggyConnect.init()
    } catch (connectError) {
      setError((connectError as Error).message)
    } finally {
      setConnecting(false)
    }
  }

  const handleSyncAll = async () => {
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Não foi possível sincronizar as contas.')
      fetchAccounts()
    } catch (syncError) {
      setError((syncError as Error).message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja desconectar esta conta?')) return
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', bankAccountId: id }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Não foi possível desconectar a conta.')
      fetchAccounts()
    } catch (deleteError) {
      setError((deleteError as Error).message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--blue-600)]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-[var(--foreground)]">Configurações</h1>

      {/* Connected Accounts */}
      <section className="bg-white p-6 rounded-2xl border border-[var(--border)]">
        {error && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-[var(--blue-500)] uppercase tracking-widest">Contas Conectadas</h2>
          <button
            onClick={handleSyncAll}
            className="px-3 py-1.5 rounded-xl bg-[var(--blue-50)] text-[var(--blue-600)] text-xs font-bold flex items-center gap-1 hover:bg-[var(--blue-100)] transition-colors"
          >
            <RefreshCw size={12} /> Sincronizar Todas
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[var(--blue-50)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Landmark size={28} className="text-[var(--blue-500)]" />
            </div>
            <p className="text-[var(--foreground)] font-medium mb-1">Nenhuma conta conectada</p>
            <p className="text-sm text-[var(--muted-foreground)]">Conecte suas contas para importar transações</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] hover:bg-[var(--blue-50)]/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: INSTITUTION_COLORS[acc.institution] ?? '#6b7280' }}
                  />
                  <div>
                    <p className="text-sm font-bold">{acc.name}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">{acc.institution} · {acc.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {acc.lastSyncAt ? (
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      Sync: {getTimeSince(new Date(acc.lastSyncAt))}
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-500 font-medium">Nunca sincronizado</span>
                  )}
                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Connect New */}
      <section className="bg-white p-6 rounded-2xl border border-[var(--border)]">
        <h2 className="text-sm font-black text-[var(--blue-500)] uppercase tracking-widest mb-4">Conectar Nova Conta</h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Conecte suas contas bancárias para importar transações automaticamente.
          Utilizamos a API Pluggy (instituição regulada pelo Banco Central).
        </p>
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="px-4 py-2.5 rounded-xl bg-[var(--blue-600)] text-white text-sm font-bold flex items-center gap-2 hover:bg-[var(--blue-700)] disabled:opacity-50 shadow-md shadow-[var(--blue-600)]/20 transition-all"
        >
          <Plug size={14} />
          {connecting ? 'Conectando...' : 'Conectar Conta Bancária'}
        </button>
        {error && (
          <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {['Nubank', 'Itaú', 'Inter', 'PicPay', 'Banco do Brasil', 'Bradesco', 'Santander'].map(bank => (
            <span key={bank} className="px-2 py-1 bg-[var(--muted)] text-[var(--muted-foreground)] text-[10px] font-medium rounded-lg">
              {bank}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}
