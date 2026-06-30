'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-browser'
import type { PendingAction } from '@/types'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  pendingAction: PendingAction
  isAuthModalOpen: boolean
  remaining: number | null
  setPendingAction: (action: PendingAction) => void
  openAuthModal: (action?: PendingAction) => void
  closeAuthModal: () => void
  refreshRemaining: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)

  const supabase = createClient()

  const refreshRemaining = useCallback(async () => {
    try {
      const res = await fetch('/api/user/limits')
      const data = await res.json()
      setRemaining(data.remaining ?? null)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      if (session) refreshRemaining()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session) refreshRemaining()
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openAuthModal = useCallback((action?: PendingAction) => {
    if (action) setPendingAction(action)
    setIsAuthModalOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false)
    setPendingAction(null)
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setRemaining(null)
  }, [supabase])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        pendingAction,
        isAuthModalOpen,
        remaining,
        setPendingAction,
        openAuthModal,
        closeAuthModal,
        refreshRemaining,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
