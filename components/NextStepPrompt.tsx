'use client'

import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import { analytics } from '@/lib/analytics'
import type { DecomposeResponse } from '@/types'

interface Props {
  result: DecomposeResponse
  isAuthenticated: boolean
  onDrillDown: (objective: string) => void
  onGuestClick: () => void
}

export default function NextStepPrompt({ result, isAuthenticated, onDrillDown, onGuestClick }: Props) {
  const { t } = useTranslation('common')

  if (!result.result.objectives || result.result.objectives.length === 0) return null

  const firstObjective = result.result.objectives[0].title

  function handleClick() {
    analytics.nextStepClicked()
    if (!isAuthenticated) {
      onGuestClick()
      return
    }
    onDrillDown(firstObjective)
  }

  return (
    <div className="flex items-center gap-3 py-3 border-t border-gray-100">
      <span className="text-sm text-gray-600">
        {t('next_step.prompt', { objective: firstObjective })}
      </span>
      <button
        onClick={handleClick}
        className="text-sm font-medium whitespace-nowrap hover:opacity-80 transition-opacity"
        style={{ color: '#C1714A' }}
      >
        {t('next_step.button')}
      </button>
    </div>
  )
}
