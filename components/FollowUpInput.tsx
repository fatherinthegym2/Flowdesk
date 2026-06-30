'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'

interface Props {
  onSubmit: (query: string) => void
  loading?: boolean
  currentLang: string
}

export default function FollowUpInput({ onSubmit, loading, currentLang }: Props) {
  const { t } = useTranslation('common')
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading) inputRef.current?.focus()
  }, [loading])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = value.trim()
    if (!q || loading) return
    onSubmit(q)
    setValue('')
  }

  const placeholder = currentLang === 'ru'
    ? 'Уточните результат или задайте новый запрос…'
    : 'Refine the result or ask a new question…'

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: '#fff',
        border: '1.5px solid #E0D6C7',
        borderRadius: 16,
        padding: '8px 8px 8px 16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={loading}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          fontSize: 14,
          color: '#2e2a24',
          background: 'transparent',
          fontFamily: 'var(--font-hanken), sans-serif',
        }}
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: '#b06a4f',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          opacity: loading || !value.trim() ? 0.4 : 1,
          transition: 'opacity 0.15s',
        }}
        aria-label={t('input.submit')}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </form>
  )
}
