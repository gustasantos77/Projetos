'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDate, toNumber } from '@/lib/helpers'
import { CreditCard, TrendingDown, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'

interface CreditCardData {
  account: {
    id: string
    name: string
    institution: string
    balance: number | null
    type: string
  } | null
  transactions: Array<{
    id: string
    description: string
    amount: { toNumber(): number }
    type: string
    date: string
    category: { name: string; color: string | null } | null
  }>
  totalExpenses: number
  totalPayments: number
  currentBalance: number
  transactionCount: number
}

const INSTITUTION_COLORS: Record<string, string> = {
  'Nubank': '#820AD1',
  'Itaú': '#EC7000',
  'Inter': '#FF7A00',
  'PicPay': '#22c55e',
  'Banco do Brasil': '#2563eb',
}

export default function CreditCardView() {
  const [data, setData] = useState<CreditCardData | null>(null)
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/credit-card?month=${month}&year=${year}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [month, year])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--blue-600)]" />
      </div>
    )
  }

  if (!data?.account) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 bg-[var(--blue-50)] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CreditCard size={24} className="text-[var(--blue-500)]" />
        </div>
        <p className="text-[var(--foreground)] font-medium mb-1">Nenhum cartão de crédito conectado</p>
        <p className="text-sm text-[var(--muted-foreground)]">
          Vá em <strong>Configurações</strong> para conectar sua conta bancária
        </p>
      </div>
    )
  }

  const { account, transactions, totalExpenses, totalPayments, currentBalance, transactionCount } = data
  const color = INSTITUTION_COLORS[account.institution] ?? '#6b7280'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xs font-black text-[var(--blue-500)] uppercase tracking-widest mb-1">Cartão de Crédito</h2>
          <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight">{account.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1) }}
            className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--blue-50)] text-[var(--muted-foreground)] hover:text-[var(--blue-600)] transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold min-w-[80px] text-center">{String(month).padStart(2, '0')}/{year}</span>
          <button
            onClick={() => { if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1) }}
            className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--blue-50)] text-[var(--muted-foreground)] hover:text-[var(--blue-600)] transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-500"><TrendingDown size={18} /></div>
            <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Gastos do Mês</span>
          </div>
          <p className="text-xl font-black text-red-500">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-[var(--green-50)] text-[var(--green-600)]"><TrendingUp size={18} /></div>
            <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Pagamentos</span>
          </div>
          <p className="text-xl font-black text-[var(--green-600)]">{formatCurrency(totalPayments)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-[var(--blue-50)] text-[var(--blue-600)]"><CreditCard size={18} /></div>
            <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Saldo da Fatura</span>
          </div>
          <p className={`text-xl font-black ${currentBalance > 0 ? 'text-red-500' : 'text-[var(--green-600)]'}`}>
            {formatCurrency(currentBalance)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-bold text-[var(--muted-foreground)]">{account.institution}</span>
        <span className="text-xs text-[var(--muted-foreground)]">· {transactionCount} transações</span>
      </div>

      <section className="bg-white p-6 rounded-2xl border border-[var(--border)]">
        <h2 className="text-sm font-black text-[var(--blue-500)] uppercase tracking-widest mb-4">Transações do Cartão</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-[var(--muted)] rounded-xl flex items-center justify-center mx-auto mb-3">
              <CreditCard size={20} className="text-[var(--muted-foreground)]" />
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">Nenhuma transação neste mês</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${tx.type === 'INCOME' ? 'bg-[var(--green-50)] text-[var(--green-600)]' : 'bg-red-50 text-red-500'}`}>
                    {tx.type === 'INCOME' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold truncate max-w-[200px] sm:max-w-none">{tx.description}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">{tx.category?.name ?? 'Sem categoria'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${tx.type === 'INCOME' ? 'text-[var(--green-600)]' : 'text-red-500'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(toNumber(tx.amount))}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">{formatDate(tx.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
