'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, toNumber } from '@/lib/helpers'
import { AlertTriangle, Trash2, Plus, PieChart, ChevronLeft, ChevronRight } from 'lucide-react'

interface Budget {
  id: string
  amount: { toNumber(): number }
  spent: number
  remaining: number
  usagePercent: number
  category: { id: string; name: string; color: string | null }
}

interface Category {
  id: string
  name: string
  type: string
}

export default function BudgetOverview() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [showForm, setShowForm] = useState(false)
  const [newCategoryId, setNewCategoryId] = useState('')
  const [newAmount, setNewAmount] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [budgetRes, catRes] = await Promise.all([
        fetch(`/api/budgets?month=${month}&year=${year}`),
        fetch('/api/categories?type=EXPENSE'),
      ])
      if (budgetRes.ok) {
        const data = await budgetRes.json()
        const txRes = await fetch(`/api/transactions?month=${month}&year=${year}&type=EXPENSE`)
        const txs = txRes.ok ? await txRes.json() : []

        const enriched = data.map((b: Budget) => {
          const spent = txs
            .filter((t: { categoryId: string }) => t.categoryId === b.category.id)
            .reduce((sum: number, t: { amount: unknown }) => sum + toNumber(t.amount), 0)
          return {
            ...b,
            spent,
            remaining: toNumber(b.amount) - spent,
            usagePercent: toNumber(b.amount) > 0 ? (spent / toNumber(b.amount)) * 100 : 0,
          }
        })
        setBudgets(enriched)
      }
      if (catRes.ok) setCategories(await catRes.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [month, year])

  const handleCreate = async () => {
    if (!newCategoryId || !newAmount) return
    await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: newCategoryId, amount: Number(newAmount), month, year }),
    })
    setNewCategoryId('')
    setNewAmount('')
    setShowForm(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' })
    fetchData()
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-black text-[var(--foreground)]">Orçamentos</h1>
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
          <button
            onClick={() => setShowForm(!showForm)}
            className="ml-2 px-4 py-2 rounded-xl bg-[var(--blue-600)] text-white text-sm font-bold flex items-center gap-2 hover:bg-[var(--blue-700)] shadow-md shadow-[var(--blue-600)]/20 transition-all"
          >
            <Plus size={14} /> Novo Orçamento
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-2xl border border-[var(--border)] flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-[var(--muted-foreground)] mb-1">Categoria</label>
            <select
              value={newCategoryId}
              onChange={e => setNewCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)] focus:border-transparent"
            >
              <option value="">Selecione...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-[var(--muted-foreground)] mb-1">Limite (R$)</label>
            <input
              type="number"
              value={newAmount}
              onChange={e => setNewAmount(e.target.value)}
              placeholder="0,00"
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)] focus:border-transparent"
            />
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2.5 rounded-xl bg-[var(--blue-600)] text-white text-sm font-bold hover:bg-[var(--blue-700)] transition-colors"
          >
            Salvar
          </button>
        </div>
      )}

      {budgets.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-16 h-16 bg-[var(--blue-50)] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PieChart size={24} className="text-[var(--blue-500)]" />
          </div>
          <p className="text-[var(--foreground)] font-medium mb-1">Nenhum orçamento definido</p>
          <p className="text-sm text-[var(--muted-foreground)]">Crie um orçamento para controlar seus gastos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map(b => (
            <div key={b.id} className="bg-white p-5 rounded-2xl border border-[var(--border)] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.category.color ?? 'var(--blue-500)' }} />
                  <span className="font-bold">{b.category.name}</span>
                </div>
                <button onClick={() => handleDelete(b.id)} className="text-[var(--muted-foreground)] hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[var(--muted-foreground)]">{formatCurrency(b.spent)} gasto</span>
                <span className="text-[var(--muted-foreground)]">{formatCurrency(toNumber(b.amount))} limite</span>
              </div>
              <div className="w-full h-3 bg-[var(--muted)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${b.usagePercent > 100 ? 'bg-red-500' : b.usagePercent > 80 ? 'bg-amber-500' : 'bg-[var(--green-500)]'}`}
                  style={{ width: `${Math.min(b.usagePercent, 100)}%` }}
                />
              </div>
              {b.usagePercent > 80 && (
                <div className="flex items-center gap-1 mt-2">
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
    </div>
  )
}
