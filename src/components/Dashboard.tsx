'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatCurrency, formatMonth, toNumber } from '@/lib/helpers'
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, AlertTriangle, RefreshCw, Plus, Landmark, ChevronLeft, ChevronRight, PieChart as PieChartIcon } from 'lucide-react'
import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import TransactionForm from './TransactionForm'
import BankIcon, { getInstitutionLabel } from './BankIcon'

interface DashboardData {
  totalBalance: number
  totalIncome: number
  totalExpenses: number
  netBalance: number
  transactionCount: number
  accounts: Array<{
    id: string
    name: string
    institution: string
    balance: number | null
    type: string
    lastSyncAt: string | null
  }>
  budgetsWithUsage: Array<{
    id: string
    amount: { toNumber(): number }
    spent: number
    remaining: number
    usagePercent: number
    category: { name: string; color: string | null; icon: string | null }
  }>
  expensesByCategory: Array<{ name: string; amount: number; color: string }>
  recentTransactions: Array<{
    id: string
    description: string
    amount: { toNumber(): number }
    type: string
    date: string
    category: { name: string; color: string | null } | null
    bankAccount: { name: string } | null
  }>
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

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const fetchData = useCallback(async () => {
    setLoading(true)
    setData(null)
    try {
      const res = await fetch(`/api/stats?month=${month}&year=${year}&_t=${Date.now()}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => { fetchData() }, [month, year])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync' }),
        })
        await fetchData()
      } catch {}
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [month, year, fetchData])

  const handleSync = async () => {
    setSyncing(true)
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      })
      await fetchData()
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--blue-600)]" />
      </div>
    )
  }

  if (!data) return <p className="text-center text-[var(--muted-foreground)] py-10">Erro ao carregar dados.</p>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xs font-black text-[var(--blue-500)] uppercase tracking-widest mb-1">Finanças Pessoais</h2>
          <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight capitalize">{formatMonth(month, year)}</h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            {data.transactionCount ?? data.recentTransactions.length} transações neste mês
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1) }}
            className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--blue-600)] transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold text-[var(--foreground)] min-w-[100px] text-center">
            {formatMonth(month, year)}
          </span>
          <button
            onClick={() => { if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1) }}
            className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--blue-600)] transition-colors"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="ml-2 px-4 py-2 rounded-xl bg-[var(--blue-600)] text-white text-sm font-bold flex items-center gap-2 hover:bg-[var(--blue-700)] disabled:opacity-50 shadow-md shadow-[var(--blue-600)]/20 transition-all"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] shadow-sm card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-[var(--muted)] text-[var(--blue-600)]">
              <Wallet size={18} />
            </div>
            <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Saldo Total</span>
          </div>
          <p className="text-xl font-black">{formatCurrency(data.totalBalance)}</p>
        </div>
        <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] shadow-sm card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-[var(--muted)] text-[var(--green-600)]">
              <ArrowUpRight size={18} />
            </div>
            <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Receitas</span>
          </div>
          <p className="text-xl font-black text-[var(--green-600)]">{formatCurrency(data.totalIncome)}</p>
        </div>
        <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] shadow-sm card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-[var(--muted)] text-red-500">
              <ArrowDownRight size={18} />
            </div>
            <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Despesas</span>
          </div>
          <p className="text-xl font-black text-red-500">{formatCurrency(data.totalExpenses)}</p>
        </div>
        <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] shadow-sm card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-xl ${data.netBalance >= 0 ? 'bg-[var(--muted)] text-[var(--green-600)]' : 'bg-[var(--muted)] text-red-500'}`}>
              {data.netBalance >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </div>
            <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Balanço</span>
          </div>
          <p className={`text-xl font-black ${data.netBalance >= 0 ? 'text-[var(--green-600)]' : 'text-red-500'}`}>
            {formatCurrency(data.netBalance)}
          </p>
        </div>
      </div>

      {/* Accounts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-[var(--blue-500)] uppercase tracking-widest">Contas Bancárias</h2>
          <Link href="/settings" className="text-xs font-bold text-[var(--blue-600)] hover:text-[var(--blue-700)] flex items-center gap-1 transition-colors">
            <Plus size={12} /> Gerenciar
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.accounts.length === 0 && (
            <div className="col-span-full bg-[var(--card)] p-8 rounded-2xl border border-[var(--border)] text-center">
              <div className="w-16 h-16 bg-[var(--muted)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Landmark size={28} className="text-[var(--blue-500)]" />
              </div>
              <p className="text-[var(--foreground)] font-medium mb-1">Nenhuma conta conectada</p>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">Conecte suas contas para importar transações automaticamente</p>
              <Link href="/settings" className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--blue-600)] text-white text-sm font-bold rounded-xl hover:bg-[var(--blue-700)] transition-colors">
                <Plus size={14} /> Conectar conta
              </Link>
            </div>
          )}
          {data.accounts.map(acc => (
            <div key={acc.id} className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <BankIcon institution={acc.institution} size={32} />
                <span className="text-xs font-bold text-[var(--muted-foreground)]">{getInstitutionLabel(acc.institution)}</span>
              </div>
              <p className="text-sm font-bold truncate">{acc.name}</p>
              <p className="text-lg font-black mt-1">{formatCurrency(acc.balance ?? 0)}</p>
              {acc.lastSyncAt ? (
                <p className="text-[10px] text-[var(--muted-foreground)] mt-2">
                  Sync: {getTimeSince(new Date(acc.lastSyncAt))}
                </p>
              ) : (
                <p className="text-[10px] text-amber-500 font-medium mt-2">Nunca sincronizado</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense by Category */}
        <section className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)]">
          <h2 className="text-sm font-black text-[var(--blue-500)] uppercase tracking-widest mb-4">Despesas por Categoria</h2>
          {data.expensesByCategory.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-[var(--muted)] rounded-xl flex items-center justify-center mx-auto mb-3">
                <PieChartIcon size={20} className="text-[var(--muted-foreground)]" />
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">Sem despesas neste mês</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="name"
                  >
                    {data.expensesByCategory.map((cat, idx) => (
                      <Cell key={idx} fill={cat.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      background: 'var(--card)',
                      color: 'var(--foreground)',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => <span className="text-xs font-medium text-[var(--foreground)]">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full space-y-2 mt-2">
                {data.expensesByCategory.slice(0, 5).map(cat => (
                  <div key={cat.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-medium">{cat.name}</span>
                    </div>
                    <span className="font-bold">{formatCurrency(cat.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Budgets */}
        <section className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-[var(--blue-500)] uppercase tracking-widest">Orçamentos</h2>
            <Link href="/budgets" className="text-xs font-bold text-[var(--blue-600)] hover:text-[var(--blue-700)] transition-colors">Ver todos</Link>
          </div>
          {data.budgetsWithUsage.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-[var(--muted)] rounded-xl flex items-center justify-center mx-auto mb-3">
                <PieChartIcon size={20} className="text-[var(--muted-foreground)]" />
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">Nenhum orçamento definido</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.budgetsWithUsage.map(b => (
                <div key={b.id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium">{b.category.name}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {formatCurrency(b.spent)} / {formatCurrency(toNumber(b.amount))}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[var(--muted)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${b.usagePercent > 100 ? 'bg-red-500' : b.usagePercent > 80 ? 'bg-amber-500' : 'bg-[var(--green-500)]'}`}
                      style={{ width: `${Math.min(b.usagePercent, 100)}%` }}
                    />
                  </div>
                  {b.usagePercent > 80 && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <AlertTriangle size={12} className={b.usagePercent > 100 ? 'text-red-500' : 'text-amber-500'} />
                      <span className={`text-[10px] font-bold ${b.usagePercent > 100 ? 'text-red-500' : 'text-amber-500'}`}>
                        {b.usagePercent > 100 ? 'Estourado!' : `${Math.round(b.usagePercent)}% usado`}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recent Transactions */}
      <section className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-[var(--blue-500)] uppercase tracking-widest">Últimas Transações</h2>
          <Link href="/transactions" className="text-xs font-bold text-[var(--blue-600)] hover:text-[var(--blue-700)] transition-colors">Ver todas</Link>
        </div>
        {data.recentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-[var(--muted)] rounded-xl flex items-center justify-center mx-auto mb-3">
              <ArrowDownRight size={20} className="text-[var(--muted-foreground)]" />
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">Nenhuma transação neste mês</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {data.recentTransactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${tx.type === 'INCOME' ? 'bg-[var(--green-50)] text-[var(--green-600)]' : 'bg-red-50 text-red-500'}`}>
                    {tx.type === 'INCOME' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold truncate max-w-[200px] sm:max-w-none">{tx.description}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      {tx.category?.name ?? 'Sem categoria'} {tx.bankAccount ? `· ${tx.bankAccount.name}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${tx.type === 'INCOME' ? 'text-[var(--green-600)]' : 'text-red-500'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(toNumber(tx.amount))}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">{new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Floating Add Button */}
      <TransactionForm onSuccess={fetchData} />
    </div>
  )
}
