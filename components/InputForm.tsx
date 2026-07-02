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

const ANIMATED_PHRASES = [
  'Хочу научиться играть на гитаре',
  'Хочу приоритизировать бэклог продукта',
  'Хочу создать онлайн-курс по дизайну',
  'Хочу сменить профессию на разработчика',
  'Хочу запустить стартап с нуля',
  'Хочу выучить английский за 6 месяцев',
  'Нужно подготовиться к защите диплома',
  'Хочу построить личный бренд в соцсетях',
  'Хочу похудеть на 10 кг за 3 месяца',
  'Хочу написать и издать книгу',
]

function useTypingPlaceholder(phrases: string[], active: boolean) {
  const [displayed, setDisplayed] = useState('')
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!active) return
    if (paused) {
      const t = setTimeout(() => setPaused(false), 1400)
      return () => clearTimeout(t)
    }

    const current = phrases[phraseIdx]

    if (!deleting) {
      if (charIdx < current.length) {
        const t = setTimeout(() => {
          setDisplayed(current.slice(0, charIdx + 1))
          setCharIdx((c) => c + 1)
        }, 48)
        return () => clearTimeout(t)
      } else {
        setPaused(true)
        setDeleting(true)
        return
      }
    } else {
      if (charIdx > 0) {
        const t = setTimeout(() => {
          setDisplayed(current.slice(0, charIdx - 1))
          setCharIdx((c) => c - 1)
        }, 28)
        return () => clearTimeout(t)
      } else {
        setDeleting(false)
        setPhraseIdx((i) => (i + 1) % phrases.length)
        return
      }
    }
  }, [active, paused, deleting, charIdx, phraseIdx, phrases])

  return displayed
}

export default function InputForm({ onResult, onLoading, currentLang, initialQuery = '' }: Props) {
  const { t } = useTranslation('common')
  const { user, openAuthModal, refreshRemaining } = useAuth()
  const [query, setQuery] = useState(initialQuery)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const animatedPlaceholder = useTypingPlaceholder(ANIMATED_PHRASES, !query && !focused)

  useEffect(() => {
    if (!document.cookie.includes('fd_guest_visited')) {
      analytics.guestSessionStarted()
      trackGuestVisit()
    }
  }, [])

  // initialQuery only changes right after a query was submitted (from this form
  // or from the follow-up box) — the submitted text now lives in the chat bubble,
  // so the main textarea should clear, not mirror it.
  useEffect(() => {
    setQuery('')
  }, [initialQuery])

  async function doSubmit() {
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
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    doSubmit()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!loading && query.trim()) doSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-2">
      <div
        className="relative bg-white rounded-2xl shadow-sm"
        style={{ border: '1.5px solid #E0D6C7' }}
      >
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setError('')
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={animatedPlaceholder || ' '}
          disabled={loading}
          rows={4}
          maxLength={MAX_CHARS}
          className="w-full resize-none px-4 pt-4 pb-12 bg-transparent rounded-2xl focus:outline-none text-sm leading-relaxed"
          style={{
            color: '#2e2a24',
            fontFamily: 'var(--font-hanken), sans-serif',
          }}
        />
        <div className="absolute bottom-3 left-4 right-3 flex items-center justify-between">
          <span style={{ fontSize: 12, color: '#b0a89e', fontFamily: 'var(--font-space-mono), monospace' }}>
            {query.length} / {MAX_CHARS}
          </span>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="btn-interactive w-9 h-9 rounded-xl flex items-center justify-center text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: '#b06a4f' }}
            aria-label={t('input.submit')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 px-1">{error}</p>}

      <p className="text-xs text-center leading-relaxed" style={{ color: '#b0a89e' }}>
        {t('input.privacy')}
      </p>
    </form>
  )
}
