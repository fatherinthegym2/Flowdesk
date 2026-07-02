'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import { createClient } from '@/lib/supabase-browser'
import { analytics } from '@/lib/analytics'
import Link from 'next/link'
import Logo from '@/components/Logo'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

type Tab = 'register' | 'login'

export default function AuthModal({ onClose, onSuccess }: Props) {
  const { t } = useTranslation('common')
  const [tab, setTab] = useState<Tab>('register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (tab === 'register') {
        // Use server-side admin API so email confirmation is not required (bypasses SMTP)
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error || t('auth.error_generic'))
          return
        }
        // Sign in immediately after successful registration
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          setError(signInError.message || t('auth.error_generic'))
          return
        }
        analytics.userRegistered()
        onSuccess()
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setError(error.message && error.message !== '{}' ? error.message : t('auth.error_generic'))
          return
        }
        onSuccess()
      }
    } catch {
      setError(t('auth.error_generic'))
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  const subtitle =
    tab === 'register'
      ? t('auth.subtitle_register', 'Войдите в аккаунт, чтобы продолжить.')
      : t('auth.subtitle_login', 'Войдите, чтобы продолжить работу.')

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl p-8 mx-4 shadow-xl"
        style={{ width: 384, maxWidth: '100%' }}
      >
        <button
          onClick={onClose}
          className="icon-btn absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>

        {/* Logo header */}
        <div style={{ marginBottom: 20 }}>
          <Logo size="md" />
        </div>

        <h2
          className="text-lg font-bold text-gray-900 mb-1"
          style={{ minHeight: 28, display: 'flex', alignItems: 'center' }}
        >
          {subtitle}
        </h2>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 mt-5" style={{ height: 40 }}>
          {(['register', 'login'] as Tab[]).map((t_) => (
            <button
              key={t_}
              onClick={() => { setTab(t_); setError('') }}
              className={`flex-1 rounded-md text-sm font-medium transition-all duration-150 ${
                tab === t_
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              {t_ === 'register' ? t('auth.tab_register') : t('auth.tab_login')}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {t('auth.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {t('auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-interactive w-full py-3 rounded-full text-white font-medium text-sm transition-opacity disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: '#C1714A' }}
          >
            {loading ? '...' : tab === 'register' ? t('auth.register_button') : t('auth.login_button')}
          </button>

          <div style={{ minHeight: 32 }}>
            {tab === 'login' && (
              <div className="text-center">
                <Link
                  href="/auth/reset-password"
                  onClick={onClose}
                  className="link-interactive text-xs font-medium"
                  style={{ color: '#C1714A' }}
                >
                  {t('auth.forgot_password')}
                </Link>
              </div>
            )}

            {tab === 'register' && (
              <p className="text-xs text-gray-400 text-center">{t('auth.register_consent')}</p>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
