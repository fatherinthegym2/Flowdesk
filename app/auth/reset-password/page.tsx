'use client'

import { useState, useRef, useEffect } from 'react'
import { I18nextProvider, useTranslation } from 'react-i18next'
import i18n from '@/lib/i18n'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import toast from 'react-hot-toast'

function ProgressBar({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= s ? 'text-white' : 'bg-gray-200 text-gray-400'
            }`}
            style={{ backgroundColor: step >= s ? '#C1714A' : undefined }}
          >
            {s}
          </div>
          {s < 3 && (
            <div
              className="w-8 h-0.5"
              style={{ backgroundColor: step > s ? '#C1714A' : '#e5e7eb' }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function ResetPasswordForm() {
  const { t } = useTranslation('common')
  const supabase = createClient()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const resendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (resendIntervalRef.current) clearInterval(resendIntervalRef.current)
    }
  }, [])

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: undefined,
      })
      if (error) {
        if (error.message.includes('not found') || error.message.includes('User not found')) {
          setError(t('reset_password.error_not_found'))
        } else if (error.message.includes('rate') || error.status === 429) {
          setError(t('reset_password.error_rate_limit'))
        } else {
          setError(t('reset_password.error_send'))
        }
        return
      }
      setStep(2)
    } catch {
      setError(t('reset_password.error_send'))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery',
      })
      if (error) {
        if (error.message.includes('expired')) {
          setError(t('reset_password.error_expired'))
        } else {
          setError(t('reset_password.error_wrong_code'))
        }
        return
      }
      setStep(3)
    } catch {
      setError(t('reset_password.error_wrong_code'))
    } finally {
      setLoading(false)
    }
  }

  async function handleNewPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError(t('reset_password.passwords_mismatch'))
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setError(t('reset_password.error_send'))
        return
      }
      await supabase.auth.signOut()
      toast.success(t('reset_password.success'))
    } catch {
      setError(t('reset_password.error_send'))
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setError('')
    setLoading(true)
    try {
      await supabase.auth.resetPasswordForEmail(email)
      setResendCooldown(30)
      if (resendIntervalRef.current) clearInterval(resendIntervalRef.current)
      resendIntervalRef.current = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) {
            if (resendIntervalRef.current) clearInterval(resendIntervalRef.current)
            return 0
          }
          return c - 1
        })
      }, 1000)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F0EDE8' }}>
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-sm">
        <Link href="/" className="link-interactive text-sm font-bold mb-6 inline-block" style={{ color: '#C1714A' }}>
          FlowDesk
        </Link>

        <ProgressBar step={step} />

        {step === 1 && (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{t('reset_password.title')}</h1>
            <p className="text-sm text-gray-500 mb-6">{t('reset_password.step1_subtitle')}</p>
            <form onSubmit={handleSendCode} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.email')}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="btn-interactive w-full py-3 rounded-full text-white font-medium text-sm disabled:opacity-50"
                style={{ backgroundColor: '#C1714A' }}
              >
                {loading ? '...' : t('reset_password.send_code')}
              </button>
            </form>
            <Link href="/" className="link-interactive block mt-4 text-sm text-gray-400 hover:text-gray-600">
              {t('reset_password.back')}
            </Link>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{t('reset_password.step2_title')}</h1>
            <p className="text-sm text-gray-500 mb-6">
              {t('reset_password.step2_subtitle', { email })}
            </p>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="btn-interactive w-full py-3 rounded-full text-white font-medium text-sm disabled:opacity-50"
                style={{ backgroundColor: '#C1714A' }}
              >
                {loading ? '...' : t('reset_password.confirm')}
              </button>
            </form>
            <button
              onClick={handleResend}
              disabled={loading || resendCooldown > 0}
              className="btn-interactive block mt-4 text-sm transition-all duration-150"
              style={{
                color: resendCooldown > 0 ? '#bcb4ad' : '#9ca3af',
                cursor: resendCooldown > 0 ? 'default' : 'pointer',
              }}
              onMouseEnter={(e) => { if (resendCooldown === 0) (e.currentTarget.style.color = '#6b7280') }}
              onMouseLeave={(e) => { if (resendCooldown === 0) (e.currentTarget.style.color = '#9ca3af') }}
              onMouseDown={(e) => { if (resendCooldown === 0) (e.currentTarget.style.opacity = '0.6') }}
              onMouseUp={(e) => { if (resendCooldown === 0) (e.currentTarget.style.opacity = '1') }}
            >
              {resendCooldown > 0
                ? `${t('reset_password.resend')} (${resendCooldown}с)`
                : t('reset_password.resend')}
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{t('reset_password.step3_title')}</h1>
            <p className="text-sm text-gray-500 mb-6">{t('reset_password.step3_subtitle')}</p>
            <form onSubmit={handleNewPassword} className="space-y-4">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('reset_password.new_password')}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('reset_password.confirm_password')}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              {error && <p className="text-sm" style={{ color: '#C1714A' }}>{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="btn-interactive w-full py-3 rounded-full text-white font-medium text-sm disabled:opacity-50"
                style={{ backgroundColor: '#C1714A' }}
              >
                {loading ? '...' : t('reset_password.save_password')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <I18nextProvider i18n={i18n}>
      <ResetPasswordForm />
    </I18nextProvider>
  )
}
