'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, CreditCard, PieChart, Repeat, Settings, LogOut } from 'lucide-react'
import { clsx } from 'clsx'
import { signOut } from 'next-auth/react'

const tabs = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transações', icon: ArrowLeftRight },
  { href: '/credit-card', label: 'Cartão', icon: CreditCard },
  { href: '/budgets', label: 'Orçamentos', icon: PieChart },
  { href: '/recurring', label: 'Recorrentes', icon: Repeat },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

export default function FinanceNav() {
  const pathname = usePathname()

  return (
    <div className="flex items-center justify-between gap-4">
      <nav className="flex gap-1 p-1 bg-white rounded-2xl border border-[var(--border)] overflow-x-auto flex-1">
        {tabs.map(tab => {
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all',
                isActive
                  ? 'bg-[var(--blue-600)] text-white shadow-md shadow-[var(--blue-600)]/20'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--blue-50)]'
              )}
            >
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </Link>
          )
        })}
      </nav>
      <button
        onClick={() => signOut({ callbackUrl: '/auth/signin' })}
        className="p-2.5 rounded-xl text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 transition-colors"
        title="Sair"
      >
        <LogOut size={18} />
      </button>
    </div>
  )
}
