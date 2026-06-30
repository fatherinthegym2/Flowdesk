'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import { useAuth } from '@/contexts/AuthContext'
import { checkGuestLimit, markGuestLimitUsed, trackGuestVisit } from '@/lib/limits-client'
import { analytics } from '@/lib/analytics'
import toast from 'react-hot-toast'
import type { DecomposeResponse } from '@/types'

interface Props {
  onResult: (result: DecomposeResponse, query: string) => void
  onLoading: (loading: boolean) => void
  currentLang: string
  initialQuery?: string
}

const MAX_CHARS = 2000

export default function InputForm({ onResult, onLoading, currentLang, initialQuery = '' }: Props) {
  const { t } = useTranslation('common')
  const { user, openAuthModal, refreshRemaining } = useAuth()
  const [query, setQuery] = useState(initialQuery)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSlow, setShowSlow] = useState(false)
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const placeholders = [
    t('input.placeholder_1'),
    t('input.placeholder_2'),
    t('input.placeholder_3'),
  ]
  const [placeholderIdx] = useState(() => Math.floor(Math.random() * placeholders.length))

  useEffect(() => {
    trackGuestVisit()
    if (!document.cookie.includes('fd_guest_visited')) {
      analytics.guestSessionStarted()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (query.length > MAX_CHARS) {
      setError(t('input.error_too_long'))
      return
    }

    if (!user) {
      if (!checkGuestLimit()) {
        openAuthModal(null)
        return
      }
    }

    setLoading(true)
    onLoading(true)
    analytics.inputSent()

    slowTimerRef.current = setTimeout(() => setShowSlow(true), 15000)

    try {
      const res = await fetch('/api/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, siteLocale: currentLang }),
      })

      if (res.status === 400) {
        setError(t('input.error_too_long'))
        return
      }

      if (res.status === 429) {
        // зарегистрированный пользователь — показывается через onResult
        const data = await res.json()
        toast.error(data.error || t('result.error_generic'))
        return
      }

      if (!res.ok) {
        toast.error(t('result.error_generic'))
        return
      }

      const data: DecomposeResponse = await res.json()
      analytics.resultViewed()

      if (!user) markGuestLimitUsed()
      if (user) refreshRemaining()

      onResult(data, query)
    } catch {
      toast.error(t('result.error_generic'))
    } finally {
      setLoading(false)
      onLoading(false)
      setShowSlow(false)
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-2">
      <div className="relative bg-white rounded-2xl shadow-sm">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setError('')
          }}
          placeholder={placeholders[placeholderIdx]}
          disabled={loading}
          rows={4}
          maxLength={MAX_CHARS}
          className="w-full resize-none px-4 pt-4 pb-12 text-gray-900 placeholder-gray-400 bg-transparent rounded-2xl focus:outline-none text-sm leading-relaxed"
        />
        <div className="absolute bottom-3 left-4 right-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {query.length} / {MAX_CHARS}
          </span>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: '#C1714A' }}
            aria-label={t('input.submit')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 px-1">{error}</p>}

      {loading && showSlow && (
        <p className="text-sm text-gray-400 text-center">{t('input.slow_request')}</p>
      )}

      <p className="text-xs text-gray-400 text-center leading-relaxed">
        {t('input.privacy')}
      </p>
    </form>
  )
}
