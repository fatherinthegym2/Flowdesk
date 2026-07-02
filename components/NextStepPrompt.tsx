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

  const target = result.result.objectives.reduce((best, obj) =>
    (obj.steps?.length ?? 0) > (best.steps?.length ?? 0) ? obj : best,
    result.result.objectives[0]
  )

  function handleClick() {
    analytics.nextStepClicked()
    if (!isAuthenticated) {
      onGuestClick()
      return
    }
    onDrillDown(target.title)
  }

  return (
    <div
      onClick={handleClick}
      className="card-interactive"
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#b06a4f' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d8c9b3' }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        border: '1.5px dashed #d8c9b3',
        backgroundColor: '#fbf6ee',
        borderRadius: 11,
        padding: '12px 15px',
        marginTop: 16,
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 13, color: '#6f6a62', lineHeight: 1.4 }}>
        {t('next_step.prompt_pre')}&nbsp;
        <strong style={{ color: '#3a342c', fontWeight: 600 }}>«{target.title}»</strong>
        &nbsp;{t('next_step.prompt_post')}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#b06a4f',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--font-hanken), sans-serif',
        }}
      >
        {t('next_step.button')}
      </span>
    </div>
  )
}
