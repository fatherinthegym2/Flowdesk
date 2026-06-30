'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import { analytics } from '@/lib/analytics'
import type { DecomposeResponse } from '@/types'

interface Props {
  query: string
  result: DecomposeResponse
  onRated?: () => void
}

export default function RatingBlock({ query, result, onRated }: Props) {
  const { t } = useTranslation('common')
  const [active, setActive] = useState<number | null>(null)

  function handleRate(rating: number) {
    const isFirst = active === null
    setActive(rating)
    analytics.ratingSubmitted(rating)
    if (isFirst) onRated?.()

    fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, result, rating }),
    }).catch((err) => console.error('Rating error:', err))
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 13, color: '#6f6a62', whiteSpace: 'nowrap' }}>
        {t('rating.label')}
      </span>
      <div style={{ display: 'flex', gap: 7 }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const isActive = active === n
          return (
            <button
              key={n}
              onClick={() => handleRate(n)}
              style={{
                fontSize: 12,
                fontWeight: 500,
                padding: '6px 13px',
                borderRadius: 8,
                border: `1px solid ${isActive ? '#b06a4f' : '#e3d8c7'}`,
                backgroundColor: isActive ? '#b06a4f' : '#fff',
                color: isActive ? '#fff' : '#6f6a62',
                cursor: 'pointer',
                fontFamily: 'var(--font-hanken), sans-serif',
                transition: 'all 0.15s',
                lineHeight: 1,
              }}
            >
              {n}
            </button>
          )
        })}
      </div>
    </div>
  )
}
