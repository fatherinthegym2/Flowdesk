'use client'

import { useState, useCallback } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n'
import Header from '@/components/Header'
import Logo from '@/components/Logo'
import InputForm from '@/components/InputForm'
import FormatTabs from '@/components/FormatTabs'
import RatingBlock from '@/components/RatingBlock'
import NextStepPrompt from '@/components/NextStepPrompt'
import LimitExhausted from '@/components/LimitExhausted'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/contexts/AuthContext'
import { analytics } from '@/lib/analytics'
import toast from 'react-hot-toast'
import type { DecomposeResponse, ViewFormat } from '@/types'

export default function Home() {
  const { user, isAuthModalOpen, closeAuthModal, openAuthModal, pendingAction, refreshRemaining } = useAuth()
  const [currentLang, setCurrentLang] = useState('ru')
  const [result, setResult] = useState<DecomposeResponse | null>(null)
  const [drillResult, setDrillResult] = useState<DecomposeResponse | null>(null)
  const [currentQuery, setCurrentQuery] = useState('')
  const [format, setFormat] = useState<ViewFormat>('tree')
  const [loading, setLoading] = useState(false)
  const [drillLoading, setDrillLoading] = useState(false)
  const [showLimit, setShowLimit] = useState(false)
  const [ratingDone, setRatingDone] = useState(false)

  const handleLanguageChange = useCallback((lang: string) => {
    setCurrentLang(lang)
    i18n.changeLanguage(lang)
  }, [])

  const handleResult = useCallback((data: DecomposeResponse, query: string) => {
    setResult(data)
    setDrillResult(null)
    setCurrentQuery(query)
    setFormat('tree')
    setRatingDone(false)
  }, [])

  const handleFormatChange = useCallback((f: ViewFormat) => {
    analytics.formatSelected(f)
    setFormat(f)
  }, [])

  const handleFormatClickGuest = useCallback(() => {
    openAuthModal('format-switch')
  }, [openAuthModal])

  const handleDrillDown = useCallback(async (objective: string) => {
    if (!result) return
    setDrillLoading(true)

    try {
      const res = await fetch('/api/drill-down', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objective,
          previousResult: result.result,
          framework: result.framework,
          goal: result.result.goal,
        }),
      })

      if (res.status === 401) {
        openAuthModal('drill-down')
        return
      }

      if (res.status === 429) {
        setShowLimit(true)
        return
      }

      if (!res.ok) {
        toast.error('Что-то пошло не так. Попробуйте позже')
        return
      }

      const data: DecomposeResponse = await res.json()
      setDrillResult(data)
      refreshRemaining()
    } catch {
      toast.error('Что-то пошло не так. Попробуйте позже')
    } finally {
      setDrillLoading(false)
    }
  }, [result, openAuthModal, refreshRemaining])

  const handleDownload = useCallback(async () => {
    if (!result) return
    analytics.resultDownloaded()

    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: result.result.goal,
          framework: result.framework,
          result: result.result,
        }),
      })

      if (res.status === 401) {
        openAuthModal('download')
        return
      }

      if (!res.ok) {
        toast.error('Что-то пошло не так. Попробуйте позже')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'flowdesk-plan.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Что-то пошло не так. Попробуйте позже')
    }
  }, [result, openAuthModal])

  const handleAuthSuccess = useCallback(() => {
    closeAuthModal()
    refreshRemaining()

    if (pendingAction === 'download') {
      handleDownload()
    } else if (pendingAction === 'drill-down' && result) {
      const firstObjective = result.result.objectives[0]?.title
      if (firstObjective) handleDrillDown(firstObjective)
    }
  }, [pendingAction, closeAuthModal, refreshRemaining, handleDownload, handleDrillDown, result])

  return (
    <I18nextProvider i18n={i18n}>
      <div className="min-h-screen flex flex-col">
        <Header onLanguageChange={handleLanguageChange} currentLang={currentLang} />

        <main className="flex-1 flex flex-col items-center px-4">
          <div className="w-full max-w-2xl space-y-8" style={!result ? { marginTop: 'calc(50vh - 220px)' } : { paddingTop: 48 }}>
            {/* Hero */}
            <div className="text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <Logo size="lg" />
              <p
                style={{
                  fontSize: 15,
                  color: '#6b6359',
                  width: 420,
                  maxWidth: '100%',
                  lineHeight: 1.6,
                  margin: 0,
                  minHeight: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {currentLang === 'ru'
                  ? 'Превратите любую цель или список задач в структурированный план действий'
                  : 'Turn any goal or task list into a structured action plan'}
              </p>
            </div>

            {/* Input */}
            <InputForm
              onResult={handleResult}
              onLoading={setLoading}
              currentLang={currentLang}
              initialQuery={currentQuery}
            />

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: '#C1714A',
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* User query bubble + results */}
            {!loading && result && (
              <>
                <div className="flex justify-end">
                  <div
                    className="max-w-sm px-4 py-2 rounded-2xl rounded-tr-none text-sm text-white"
                    style={{ backgroundColor: '#C1714A' }}
                  >
                    {currentQuery}
                  </div>
                </div>

                {/* Result card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <FormatTabs
                        data={result}
                        activeFormat={format}
                        onFormatChange={handleFormatChange}
                        onFormatClickGuest={handleFormatClickGuest}
                        isAuthenticated={!!user}
                      />
                    </div>

                    <button
                      onClick={user ? handleDownload : () => openAuthModal('download')}
                      title={currentLang === 'ru' ? 'Скачать PDF' : 'Download PDF'}
                      className="ml-4 flex-shrink-0 p-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                  </div>

                  {!ratingDone && (
                    <RatingBlock
                      query={currentQuery}
                      result={result}
                      onRated={() => setRatingDone(true)}
                    />
                  )}

                  <NextStepPrompt
                    result={result}
                    isAuthenticated={!!user}
                    onDrillDown={handleDrillDown}
                    onGuestClick={() => openAuthModal('drill-down')}
                  />
                </div>

                {/* Drill-down loading */}
                {drillLoading && (
                  <div className="flex items-center gap-3 py-4 pl-6">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ backgroundColor: '#C1714A', animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-400">
                      {currentLang === 'ru' ? 'Детализируем...' : 'Analyzing...'}
                    </span>
                  </div>
                )}

                {/* Drill-down result */}
                {drillResult && (
                  <div
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4 ml-8 border-l-4"
                    style={{ borderLeftColor: '#C1714A' }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#C1714A' }}>
                      {currentLang === 'ru' ? 'Углублённый разбор' : 'Drill-down'}
                    </p>
                    <FormatTabs
                      data={drillResult}
                      activeFormat={format}
                      onFormatChange={handleFormatChange}
                      onFormatClickGuest={handleFormatClickGuest}
                      isAuthenticated={!!user}
                    />
                    <RatingBlock
                      query={currentQuery}
                      result={drillResult}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {isAuthModalOpen && (
          <AuthModal onClose={closeAuthModal} onSuccess={handleAuthSuccess} />
        )}

        {showLimit && (
          <LimitExhausted onClose={() => setShowLimit(false)} />
        )}
      </div>
    </I18nextProvider>
  )
}
