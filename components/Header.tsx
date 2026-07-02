'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import Logo from '@/components/Logo'

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

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : ''

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        height: 58,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 26px',
        background: 'rgba(247,244,239,0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid #e8dfd1',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link href="/" className="link-interactive" style={{ textDecoration: 'none' }}>
          <Logo size="sm" />
        </Link>
        <Link
          href="#"
          className="link-interactive"
          style={{
            fontSize: 14,
            color: '#6b6359',
            textDecoration: 'none',
            fontFamily: 'var(--font-hanken), sans-serif',
            display: 'inline-block',
            minWidth: 110,
          }}
        >
          {t('header.docs')}
        </Link>
      </div>

      <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* RU | EN toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            borderRadius: 99,
            border: '1px solid #e8dfd1',
            padding: 2,
          }}
        >
          {(['ru', 'en'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => onLanguageChange?.(lang)}
              onMouseEnter={(e) => { if (currentLang !== lang) e.currentTarget.style.backgroundColor = '#efe4d8' }}
              onMouseLeave={(e) => { if (currentLang !== lang) e.currentTarget.style.backgroundColor = 'transparent' }}
              style={{
                padding: '4px 12px',
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-hanken), sans-serif',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.15s',
                backgroundColor: currentLang === lang ? '#b06a4f' : 'transparent',
                color: currentLang === lang ? '#fff' : '#9b8f85',
                transform: 'scale(1)',
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.9)' }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {remaining !== null && (
              <span
                style={{
                  fontFamily: 'var(--font-space-mono), monospace',
                  fontSize: 11,
                  color: '#8a7e6c',
                  backgroundColor: '#efe7d8',
                  border: '1px solid #e6dcc8',
                  borderRadius: 20,
                  padding: '5px 12px',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 192,
                  letterSpacing: '0.01em',
                }}
              >
                {t('header.requests_left', { count: remaining })}
              </span>
            )}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="icon-btn"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: '#b06a4f',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-hanken), sans-serif',
                }}
              >
                {initials}
              </button>
              {dropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    width: 144,
                    background: '#fff',
                    borderRadius: 12,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    border: '1px solid #e8dfd1',
                    zIndex: 50,
                  }}
                >
                  <button
                    onClick={() => { signOut(); setDropdownOpen(false) }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5efe4' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontSize: 14,
                      color: '#2e2a24',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-hanken), sans-serif',
                      borderRadius: 12,
                      transition: 'background-color 0.15s',
                    }}
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
            className="btn-interactive"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              minWidth: 120,
              height: 36,
              padding: '0 18px',
              borderRadius: 99,
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              backgroundColor: '#b06a4f',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-hanken), sans-serif',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            <span>→</span>
            <span>{t('header.start')}</span>
          </button>
        )}
      </nav>
    </header>
  )
}
