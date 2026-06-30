'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'

interface HeaderProps {
  onLanguageChange?: (lang: string) => void
  currentLang?: string
}

function LogoIcon({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        backgroundColor: '#C1714A',
        flexShrink: 0,
      }}
    />
  )
}

export default function Header({ onLanguageChange, currentLang = 'ru' }: HeaderProps) {
  const { user, remaining, signOut, openAuthModal } = useAuth()
  const { t } = useTranslation('common')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : ''

  return (
    <header className="flex items-center justify-between px-6 py-3">
      <Link href="/" className="flex items-center gap-2">
        <LogoIcon size={20} />
        <span className="font-bold text-base text-gray-900">FlowDesk</span>
      </Link>

      <nav className="flex items-center gap-5">
        <Link
          href="#"
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          {t('header.docs')}
        </Link>

        {/* RU | EN toggle */}
        <div
          className="flex items-center rounded-full border border-gray-200"
          style={{ padding: '2px' }}
        >
          {(['ru', 'en'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => onLanguageChange?.(lang)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                currentLang === lang
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
              style={currentLang === lang ? { backgroundColor: '#C1714A' } : {}}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            {remaining !== null && (
              <span className="text-xs text-gray-400">
                {t('header.requests_left', { count: remaining })}
              </span>
            )}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                style={{ backgroundColor: '#C1714A' }}
              >
                {initials}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                  <button
                    onClick={() => { signOut(); setDropdownOpen(false) }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl"
                  >
                    {t('header.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => openAuthModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#C1714A' }}
          >
            <span>→</span>
            <span>{t('header.start')}</span>
          </button>
        )}
      </nav>
    </header>
  )
}
