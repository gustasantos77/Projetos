'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDate, toNumber } from '@/lib/helpers'
import { TrendingUp, TrendingDown, Search, X, ChevronLeft, ChevronRight, Download, Pencil } from 'lucide-react'
import TransactionForm, { type TransactionData } from './TransactionForm'

interface Transaction {
  id: string
  description: string
  amount: { toNumber(): number }
  type: string
  date: string
  category: { name: string; color: string | null } | null
  bankAccount: { name: string; institution: string } | null
  isRecurring: boolean
}

interface Category {
  id: string
  name: string
  type: string
}

export default function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [editingTx, setEditingTx] = useState<TransactionData | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ month: String(month), year: String(year) })
      if (search) params.set('search', search)
      if (typeFilter) params.set('type', typeFilter)
      if (categoryFilter) params.set('categoryId', categoryFilter)

      const [txRes, catRes] = await Promise.all([
        fetch(`/api/transactions?${params.toString()}`),
        fetch('/api/categories'),
      ])

      if (txRes.ok) setTransactions(await txRes.json())
      if (catRes.ok) setCategories(await catRes.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [month, year, search, typeFilter, categoryFilter])

  const clearFilters = () => {
    setSearch('')
    setTypeFilter('')
    setCategoryFilter('')
  }

  const handleExport = () => {
    const params = new URLSearchParams({ month: String(month), year: String(year) })
    if (typeFilter) params.set('type', typeFilter)
    if (categoryFilter) params.set('categoryId', categoryFilter)
    window.open(`/api/export?${params.toString()}`, '_blank')
  }

  const handleEdit = (tx: Transaction) => {
    setEditingTx({
      id: tx.id,
      description: tx.description,
      amount: toNumber(tx.amount),
      type: tx.type,
      date: tx.date,
      categoryId: null,
      bankAccountId: null,
      notes: null,
    })
  }

  const hasFilters = search || typeFilter || categoryFilter

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--blue-600)]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-black text-[var(--foreground)]">Transações</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded-xl bg-[var(--green-50)] text-[var(--green-600)] text-xs font-bold flex items-center gap-1 hover:bg-[var(--green-100)] transition-colors"
          >
            <Download size={12} /> Exportar CSV
          </button>
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Buscar transação..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)] focus:border-transparent"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)] focus:border-transparent"
        >
          <option value="">Todos os tipos</option>
          <option value="INCOME">Receitas</option>
          <option value="EXPENSE">Despesas</option>
        </select>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)] focus:border-transparent"
        >
          <option value="">Todas categorias</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1">
            <X size={14} /> Limpar
          </button>
        )}
      </div>

      {/* List */}
      {transactions.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-16 h-16 bg-[var(--blue-50)] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingDown size={24} className="text-[var(--blue-500)]" />
          </div>
          <p className="text-[var(--foreground)] font-medium">Nenhuma transação encontrada</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)]">
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-[var(--blue-50)]/50 transition-colors group">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`p-2.5 rounded-xl ${tx.type === 'INCOME' ? 'bg-[var(--green-50)] text-[var(--green-600)]' : 'bg-red-50 text-red-500'}`}>
                  {tx.type === 'INCOME' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{tx.description}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    {tx.category?.name ?? 'Sem categoria'}
                    {tx.bankAccount ? ` · ${tx.bankAccount.name}` : ''}
                    {tx.isRecurring ? ' · Recorrente' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className={`text-sm font-black ${tx.type === 'INCOME' ? 'text-[var(--green-600)]' : 'text-red-500'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(toNumber(tx.amount))}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">{formatDate(tx.date)}</p>
                </div>
                <button
                  onClick={() => handleEdit(tx)}
                  className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--blue-600)] hover:bg-[var(--blue-50)] opacity-0 group-hover:opacity-100 transition-all"
                  title="Editar"
                >
                  <Pencil size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingTx && (
        <TransactionForm
          editTransaction={editingTx}
          onCloseEdit={() => setEditingTx(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  )
}
