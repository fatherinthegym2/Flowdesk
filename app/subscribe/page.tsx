'use client'

import Link from 'next/link'
import { I18nextProvider, useTranslation } from 'react-i18next'
import i18n from '@/lib/i18n'

function SubscribeContent() {
  const { t } = useTranslation('common')
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F0EDE8' }}>
      <div className="text-center space-y-4 max-w-sm">
        <div className="text-4xl">🚀</div>
        <h1 className="text-2xl font-bold text-gray-900">{t('subscribe.title')}</h1>
        <p className="text-gray-500 text-sm">{t('subscribe.subtitle')}</p>
        <div
          className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: '#C1714A' }}
        >
          {t('subscribe.coming_soon')}
        </div>
        <p className="text-xs text-gray-400">{t('subscribe.description')}</p>
        <Link
          href="/"
          className="block text-sm font-medium hover:opacity-80"
          style={{ color: '#C1714A' }}
        >
          ← На главную
        </Link>
      </div>
    </div>
  )
}

export default function SubscribePage() {
  return (
    <I18nextProvider i18n={i18n}>
      <SubscribeContent />
    </I18nextProvider>
  )
}
