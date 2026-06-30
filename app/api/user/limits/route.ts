import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const guestUsed = req.cookies.get('fd_guest_used')
    return NextResponse.json({
      isGuest: true,
      remaining: guestUsed ? 0 : 1,
      hasUsed: !!guestUsed,
    })
  }

  const serviceClient = await createServiceClient()
  const { data: profile, error } = await serviceClient
    .from('profiles')
    .select('requests_today, requests_reset_date')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ isGuest: false, remaining: 5, resetDate: null })
  }

  const today = new Date().toISOString().split('T')[0]
  const effectiveToday = profile.requests_reset_date !== today ? 0 : (profile.requests_today ?? 0)
  const remaining = Math.max(0, 5 - effectiveToday)

  return NextResponse.json({
    isGuest: false,
    remaining,
    resetDate: today,
  })
}
