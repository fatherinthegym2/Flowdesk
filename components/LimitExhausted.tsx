'use client'

import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import { analytics } from '@/lib/analytics'
import Link from 'next/link'

interface Props {
  onClose: () => void
}

export default function LimitExhausted({ onClose }: Props) {
  const { t } = useTranslation('common')
  const [mounted, setMounted] = useState(false)
  const [resetTime, setResetTime] = useState('')

  useEffect(() => {
    setMounted(true)

    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    setResetTime(
      tomorrow.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    )
  }, [])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>

        <div className="text-center space-y-4">
          <div
            className="text-xs font-bold tracking-widest px-3 py-1 rounded-full inline-block text-white"
            style={{ backgroundColor: '#C1714A' }}
          >
            {t('limit.badge')}
          </div>

          <h2 className="text-xl font-bold text-gray-900">{t('limit.title')}</h2>
          <p className="text-gray-500 text-sm">{t('limit.subtitle')}</p>

          {resetTime && (
            <p className="text-xs text-gray-400">
              {t('limit.reset_at', { time: resetTime })}
            </p>
          )}

          <Link
            href="/subscribe"
            onClick={() => analytics.upgradeClicked()}
            className="block w-full py-3 rounded-full text-white font-medium text-center transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#C1714A' }}
          >
            {t('limit.subscribe')}
          </Link>
        </div>
      </div>
    </div>,
    document.body
  )
}
