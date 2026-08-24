'use client'

import { useState, useEffect } from 'react'
import { X, TrendingUp, TrendingDown, ArrowLeftRight, Check, Pencil, Trash2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  type: string
  icon: string | null
  color: string | null
}

interface BankAccount {
  id: string
  name: string
  institution: string
}

export interface TransactionData {
  id: string
  description: string
  amount: number
  type: string
  date: string
  categoryId?: string | null
  bankAccountId?: string | null
  notes?: string | null
}

interface TransactionFormProps {
  onSuccess: () => void
  editTransaction?: TransactionData | null
  onCloseEdit?: () => void
}

const TYPE_OPTIONS = [
  { value: 'EXPENSE', label: 'Despesa', icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-300' },
  { value: 'INCOME', label: 'Receita', icon: TrendingUp, color: 'text-[var(--green-600)]', bg: 'bg-[var(--green-50)]', border: 'border-[var(--green-300)]' },
  { value: 'TRANSFER', label: 'Transferência', icon: ArrowLeftRight, color: 'text-[var(--blue-600)]', bg: 'bg-[var(--blue-50)]', border: 'border-[var(--blue-300)]' },
]

export default function TransactionForm({ onSuccess, editTransaction, onCloseEdit }: TransactionFormProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])

  const [type, setType] = useState('EXPENSE')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [categoryId, setCategoryId] = useState('')
  const [bankAccountId, setBankAccountId] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const isEditing = !!editTransaction

  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type)
      setDescription(editTransaction.description)
      setAmount(String(editTransaction.amount))
      setDate(editTransaction.date.split('T')[0])
      setCategoryId(editTransaction.categoryId || '')
      setBankAccountId(editTransaction.bankAccountId || '')
      setNotes(editTransaction.notes || '')
      setOpen(true)
    }
  }, [editTransaction])

  useEffect(() => {
    if (!open) return
    Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/stats').then(r => r.json()),
    ]).then(([cats, stats]) => {
      setCategories(Array.isArray(cats) ? cats : [])
      setAccounts(Array.isArray(stats?.accounts) ? stats.accounts : [])
    })
  }, [open])

  const filteredCategories = categories.filter(c => c.type === type)

  const reset = () => {
    setType('EXPENSE')
    setDescription('')
    setAmount('')
    setDate(new Date().toISOString().split('T')[0])
    setCategoryId('')
    setBankAccountId('')
    setNotes('')
    setError('')
  }

  const handleClose = () => {
    reset()
    setOpen(false)
    onCloseEdit?.()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      setError('Preencha descrição e valor')
      return
    }
    if (!categoryId) {
      setError('Selecione uma categoria')
      return
    }

    setSaving(true)
    setError('')

    try {
      const url = '/api/transactions'
      const method = isEditing ? 'PUT' : 'POST'
      const body = isEditing
        ? { id: editTransaction!.id, description: description.trim(), amount: parseFloat(amount), type, date, categoryId: categoryId || undefined, notes: notes.trim() || undefined }
        : { description: description.trim(), amount: parseFloat(amount), type, date, categoryId: categoryId || undefined, bankAccountId: bankAccountId || undefined, notes: notes.trim() || undefined }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Erro ao salvar')

      reset()
      setOpen(false)
      onCloseEdit?.()
      onSuccess()
    } catch {
      setError('Erro ao salvar transação')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editTransaction || !confirm('Tem certeza que deseja excluir esta transação?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/transactions?id=${editTransaction.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      reset()
      setOpen(false)
      onCloseEdit?.()
      onSuccess()
    } catch {
      setError('Erro ao excluir transação')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Floating Button (só mostra quando não está editando) */}
      {!isEditing && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[var(--blue-600)] text-white rounded-full shadow-lg shadow-[var(--blue-600)]/30 flex items-center justify-center hover:bg-[var(--blue-700)] hover:shadow-xl hover:scale-105 transition-all active:scale-95"
        >
          <span className="text-2xl font-light leading-none mt-[-2px]">+</span>
        </button>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-bold">{isEditing ? 'Editar Transação' : 'Nova Transação'}</h2>
              <div className="flex items-center gap-1">
                {isEditing && (
                  <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Excluir">
                    <Trash2 size={18} />
                  </button>
                )}
                <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Type Selector */}
              <div>
                <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Tipo</label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPE_OPTIONS.map(opt => {
                    const Icon = opt.icon
                    const selected = type === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setType(opt.value); setCategoryId('') }}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
                          selected
                            ? `${opt.bg} ${opt.border} ${opt.color}`
                            : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--blue-200)]'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-xs font-bold">{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Valor</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[var(--muted-foreground)]">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-12 pr-4 py-3 text-xl font-black bg-[var(--muted)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)] transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Descrição</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: Supermercado, Salário, Aluguel..."
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)] transition-all"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)] transition-all"
                />
              </div>

              {/* Category - OBRIGATÓRIO */}
              <div>
                <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                  Categoria <span className="text-red-500">*</span>
                </label>
                {filteredCategories.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {filteredCategories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryId(cat.id)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
                          categoryId === cat.id
                            ? 'border-[var(--blue-600)] bg-[var(--blue-50)] text-[var(--blue-600)]'
                            : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--blue-200)]'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: (cat.color || '#64748B') + '20', color: cat.color || '#64748B' }}>
                          {cat.icon}
                        </div>
                        <span className="text-xs font-bold">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--muted-foreground)]">Nenhuma categoria disponível</p>
                )}
              </div>

              {/* Bank Account (só na criação) */}
              {!isEditing && accounts.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Conta</label>
                  <select
                    value={bankAccountId}
                    onChange={e => setBankAccountId(e.target.value)}
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)] transition-all bg-white"
                  >
                    <option value="">Sem conta vinculada</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.institution})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Observações</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Opcional..."
                  rows={2}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)] transition-all resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-500 font-medium">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-[var(--blue-600)] text-white font-bold rounded-xl hover:bg-[var(--blue-700)] disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-md shadow-[var(--blue-600)]/20"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <Check size={18} />
                    {isEditing ? 'Salvar Alterações' : `Salvar ${type === 'INCOME' ? 'Receita' : type === 'TRANSFER' ? 'Transferência' : 'Despesa'}`}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
