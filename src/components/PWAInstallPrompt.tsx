'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowInstall(false)
    }
    setDeferredPrompt(null)
  }

  if (!showInstall) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white p-4 rounded-2xl border border-[var(--border)] shadow-lg z-50">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-[var(--blue-50)] rounded-xl">
          <Download size={20} className="text-[var(--blue-600)]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-[var(--foreground)]">Instalar aplicativo</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Adicione às telas iniciais para acesso rápido
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 bg-[var(--blue-600)] text-white text-xs font-bold rounded-lg hover:bg-[var(--blue-700)] transition-colors"
            >
              Instalar
            </button>
            <button
              onClick={() => setShowInstall(false)}
              className="px-3 py-1.5 text-[var(--muted-foreground)] text-xs font-medium hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              Agora não
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowInstall(false)}
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
