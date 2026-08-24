import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Helper to safely convert Prisma Decimal or number
export function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value) || 0
  if (value && typeof value === 'object' && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber()
  }
  return 0
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatMonth(month: number, year: number): string {
  const date = new Date(year, month - 1, 1)
  return format(date, 'MMMM yyyy', { locale: ptBR })
}

export function getCurrentMonthRange() {
  const now = new Date()
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  }
}

export function getMonthRange(month: number, year: number) {
  const date = new Date(year, month - 1, 1)
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  }
}

export function getPreviousMonth(month: number, year: number) {
  const prev = subMonths(new Date(year, month - 1, 1), 1)
  return { month: prev.getMonth() + 1, year: prev.getFullYear() }
}

export function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const k = String(item[key])
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

export function sumBy<T>(items: T[], key: keyof T): number {
  return items.reduce((acc, item) => acc + Number(item[key]), 0)
}
