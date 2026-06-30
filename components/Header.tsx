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

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : ''

  const nextLang = currentLang === 'ru' ? 'en' : 'ru'

  return (
    <header className="flex items-center justify-between px-8 py-4">
      <Link href="/" className="flex items-center gap-2">
        <span className="font-bold text-xl" style={{ color: '#C1714A' }}>FlowDesk</span>
      </Link>

      <nav className="flex items-center gap-6">
        <Link
          href="#"
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          {t('header.docs')}
        </Link>

        <button
          onClick={() => onLanguageChange?.(nextLang)}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
        >
          {currentLang.toUpperCase()}
        </button>

        {user ? (
          <div className="flex items-center gap-4">
            {remaining !== null && (
              <span className="text-sm text-gray-500">
                {t('header.requests_left', { count: remaining })}
              </span>
            )}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white"
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
            className="px-4 py-2 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#C1714A' }}
          >
            {t('header.start')}
          </button>
        )}
      </nav>
    </header>
  )
}
