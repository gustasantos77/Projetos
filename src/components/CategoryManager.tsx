'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Check, TrendingDown, TrendingUp } from 'lucide-react'
import { getCategoryIcon } from '@/lib/category-icons'

interface Category {
  id: string
  name: string
  type: string
  icon: string | null
  color: string | null
}

const ICON_OPTIONS = [
  'UtensilsCrossed', 'Car', 'Gamepad2', 'FileText', 'Banknote',
  'ShoppingCart', 'Coffee', 'Home', 'Wifi', 'Lightbulb',
  'Heart', 'GraduationCap', 'Plane', 'Gift', 'Music',
  'Dumbbell', 'PawPrint', 'Baby', 'Wrench', 'CreditCard',
  'Landmark', 'AlertTriangle', 'Shirt', 'ArrowLeftRight', 'Percent',
  'TrendingUp', 'Briefcase', 'Wallet', 'Receipt', 'PiggyBank',
]

const COLOR_OPTIONS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#22C55E',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#E11D48',
  '#0891B2', '#64748B', '#DC2626', '#059669', '#7C3AED',
]

const TYPE_OPTIONS = [
  { value: 'EXPENSE', label: 'Despesa', icon: TrendingDown },
  { value: 'INCOME', label: 'Receita', icon: TrendingUp },
]

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [type, setType] = useState('EXPENSE')
  const [icon, setIcon] = useState('HelpCircle')
  const [color, setColor] = useState('#64748B')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(Array.isArray(data) ? data : [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  const resetForm = () => {
    setName('')
    setType('EXPENSE')
    setIcon('HelpCircle')
    setColor('#64748B')
    setError('')
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id)
    setName(cat.name)
    setType(cat.type)
    setIcon(cat.icon || 'HelpCircle')
    setColor(cat.color || '#64748B')
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }

    setSaving(true)
    setError('')

    try {
      const body = { name: name.trim(), type, icon, color }
      const url = '/api/categories'
      const method = editingId ? 'PUT' : 'POST'
      const payload = editingId ? { id: editingId, ...body } : body

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao salvar')
      }

      resetForm()
      fetchCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar categoria')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${name}"?`)) return
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao excluir')
      }
      fetchCategories()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir categoria')
    }
  }

  const expenseCategories = categories.filter(c => c.type === 'EXPENSE')
  const incomeCategories = categories.filter(c => c.type === 'INCOME')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Categorias</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Gerencie suas categorias de receitas e despesas</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--blue-600)] text-white font-bold rounded-xl hover:bg-[var(--blue-700)] transition-all shadow-md shadow-[var(--blue-600)]/20"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nova Categoria</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetForm} />
          <div className="relative bg-[var(--card)] w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            <div className="sticky top-0 bg-[var(--card)] z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-bold">{editingId ? 'Editar Categoria' : 'Nova Categoria'}</h2>
              <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Type */}
              <div>
                <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPE_OPTIONS.map(opt => {
                    const Icon = opt.icon
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setType(opt.value)}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                          type === opt.value
                            ? opt.value === 'EXPENSE'
                              ? 'border-red-400 bg-red-400/10 text-red-400'
                              : 'border-[var(--green-400)] bg-[var(--green-400)]/10 text-[var(--green-600)]'
                            : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--blue-400)]'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-sm font-bold">{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Cartão de Crédito"
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)] transition-all"
                  autoFocus
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Cor</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--card)] scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon */}
              <div>
                <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Ícone</label>
                <div className="grid grid-cols-6 gap-2">
                  {ICON_OPTIONS.map(iconName => {
                    const IconComponent = getCategoryIcon(iconName)
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setIcon(iconName)}
                        className={`p-2.5 rounded-xl border-2 transition-all flex items-center justify-center ${
                          icon === iconName
                            ? 'border-[var(--blue-600)] bg-[var(--blue-600)]/10'
                            : 'border-[var(--border)] hover:border-[var(--blue-400)]'
                        }`}
                        title={iconName}
                      >
                        <IconComponent size={18} style={{ color: icon === iconName ? color : undefined }} />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Error */}
              {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

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
                    {editingId ? 'Salvar Alterações' : 'Criar Categoria'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Categories List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--blue-600)]" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Expense Categories */}
          <div>
            <h2 className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingDown size={16} className="text-red-400" />
              Despesas ({expenseCategories.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {expenseCategories.map(cat => {
                const IconComponent = getCategoryIcon(cat.icon)
                return (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:border-[var(--blue-400)] transition-all group"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: (cat.color || '#64748B') + '20', color: cat.color || '#64748B' }}
                    >
                      <IconComponent size={18} />
                    </div>
                    <span className="font-bold text-sm flex-1 truncate">{cat.name}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="p-1.5 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--blue-600)] transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
              {expenseCategories.length === 0 && (
                <p className="text-sm text-[var(--muted-foreground)] col-span-full">Nenhuma categoria de despesa</p>
              )}
            </div>
          </div>

          {/* Income Categories */}
          <div>
            <h2 className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp size={16} className="text-[var(--green-600)]" />
              Receitas ({incomeCategories.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {incomeCategories.map(cat => {
                const IconComponent = getCategoryIcon(cat.icon)
                return (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:border-[var(--blue-400)] transition-all group"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: (cat.color || '#64748B') + '20', color: cat.color || '#64748B' }}
                    >
                      <IconComponent size={18} />
                    </div>
                    <span className="font-bold text-sm flex-1 truncate">{cat.name}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="p-1.5 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--blue-600)] transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
              {incomeCategories.length === 0 && (
                <p className="text-sm text-[var(--muted-foreground)] col-span-full">Nenhuma categoria de receita</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
