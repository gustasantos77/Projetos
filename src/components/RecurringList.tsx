'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, toNumber } from '@/lib/helpers'
import { Repeat, Trash2, Plus, ToggleLeft, ToggleRight } from 'lucide-react'

interface Recurring {
  id: string
  description: string
  amount: { toNumber(): number }
  type: string
  frequency: string
  dayOfMonth: number | null
  isActive: boolean
  category: { name: string; color: string | null } | null
}

interface Category {
  id: string
  name: string
  type: string
}

export default function RecurringList() {
  const [recurring, setRecurring] = useState<Recurring[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    description: '',
    amount: '',
    type: 'EXPENSE',
    frequency: 'MONTHLY',
    dayOfMonth: '',
    categoryId: '',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [recRes, catRes] = await Promise.all([
        fetch('/api/recurring'),
        fetch('/api/categories'),
      ])
      if (recRes.ok) setRecurring(await recRes.json())
      if (catRes.ok) setCategories(await catRes.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleCreate = async () => {
    if (!form.description || !form.amount) return
    await fetch('/api/recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amount: Number(form.amount),
        dayOfMonth: form.dayOfMonth ? Number(form.dayOfMonth) : undefined,
        categoryId: form.categoryId || undefined,
      }),
    })
    setForm({ description: '', amount: '', type: 'EXPENSE', frequency: 'MONTHLY', dayOfMonth: '', categoryId: '' })
    setShowForm(false)
    fetchData()
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetch('/api/recurring', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !isActive }),
    })
    fetchData()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/recurring?id=${id}`, { method: 'DELETE' })
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[var(--foreground)]">Lançamentos Recorrentes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl bg-[var(--blue-600)] text-white text-sm font-bold flex items-center gap-2 hover:bg-[var(--blue-700)] shadow-md shadow-[var(--blue-600)]/20 transition-all"
        >
          <Plus size={14} /> Novo
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-2xl border border-[var(--border)] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Descrição"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)] focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Valor (R$)"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              className="px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)] focus:border-transparent"
            />
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)] focus:border-transparent"
            >
              <option value="EXPENSE">Despesa</option>
              <option value="INCOME">Receita</option>
            </select>
            <select
              value={form.frequency}
              onChange={e => setForm({ ...form, frequency: e.target.value })}
              className="px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)] focus:border-transparent"
            >
              <option value="WEEKLY">Semanal</option>
              <option value="MONTHLY">Mensal</option>
              <option value="YEARLY">Anual</option>
            </select>
            <input
              type="number"
              placeholder="Dia do mês (1-31)"
              value={form.dayOfMonth}
              onChange={e => setForm({ ...form, dayOfMonth: e.target.value })}
              className="px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)] focus:border-transparent"
              min="1"
              max="31"
            />
            <select
              value={form.categoryId}
              onChange={e => setForm({ ...form, categoryId: e.target.value })}
              className="px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)] focus:border-transparent"
            >
              <option value="">Sem categoria</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2.5 rounded-xl bg-[var(--blue-600)] text-white text-sm font-bold hover:bg-[var(--blue-700)] transition-colors"
          >
            Salvar
          </button>
        </div>
      )}

      {recurring.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-16 h-16 bg-[var(--blue-50)] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Repeat size={24} className="text-[var(--blue-500)]" />
          </div>
          <p className="text-[var(--foreground)] font-medium mb-1">Nenhum lançamento recorrente</p>
          <p className="text-sm text-[var(--muted-foreground)]">Cadastre seus gastos fixos e receitas recorrentes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recurring.map(r => (
            <div key={r.id} className="bg-white p-4 rounded-2xl border border-[var(--border)] flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${r.type === 'INCOME' ? 'bg-[var(--green-50)] text-[var(--green-600)]' : 'bg-red-50 text-red-500'}`}>
                  <Repeat size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold">{r.description}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    {r.category?.name ?? 'Sem categoria'} · {r.frequency === 'MONTHLY' ? 'Mensal' : r.frequency === 'WEEKLY' ? 'Semanal' : 'Anual'}
                    {r.dayOfMonth ? ` · Dia ${r.dayOfMonth}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-black ${r.type === 'INCOME' ? 'text-[var(--green-600)]' : 'text-red-500'}`}>
                  {formatCurrency(toNumber(r.amount))}
                </span>
                <button onClick={() => handleToggle(r.id, r.isActive)} className={r.isActive ? 'text-[var(--green-500)]' : 'text-[var(--muted-foreground)]'}>
                  {r.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </button>
                <button onClick={() => handleDelete(r.id)} className="text-[var(--muted-foreground)] hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
