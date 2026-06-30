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
  const [hovered, setHovered] = useState(0)
  const [selected, setSelected] = useState(0)

  function handleRate(rating: number) {
    const isFirst = selected === 0
    setSelected(rating)
    analytics.ratingSubmitted(rating)
    if (isFirst) onRated?.()

    fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, result, rating }),
    }).catch((err) => console.error('Rating error:', err))
  }

  const display = hovered || selected

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 13, color: '#6f6a62', whiteSpace: 'nowrap' }}>
        {t('rating.label')}
      </span>
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => handleRate(star)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 1px',
              fontSize: 22,
              lineHeight: 1,
              color: star <= display ? '#b06a4f' : '#ddd0c0',
              transition: 'color 0.1s',
            }}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}
