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
  const [rated, setRated] = useState(false)

  if (rated) return null

  function handleRate(rating: number) {
    setRated(true)
    analytics.ratingSubmitted(rating)
    onRated?.()

    fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, result, rating }),
    }).catch((err) => console.error('Rating error:', err))
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500">{t('rating.label')}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => handleRate(star)}
            className="text-2xl transition-transform hover:scale-110"
            style={{ color: star <= (hovered || 0) ? '#C1714A' : '#d1d5db' }}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}
