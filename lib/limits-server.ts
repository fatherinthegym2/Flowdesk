import { createServiceClient } from '@/lib/supabase-server'

const ADMIN_EMAILS = ['fatherinthegym@gmail.com']

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email)
}

export async function checkAndDecrementUserLimit(
  userId: string,
  userEmail?: string
): Promise<{ allowed: boolean; remaining: number }> {
  if (isAdminEmail(userEmail)) {
    return { allowed: true, remaining: 999 }
  }
  const supabase = await createServiceClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('requests_today, requests_reset_date')
    .eq('id', userId)
    .single()

  if (error && error.code === 'PGRST116') {
    await supabase.from('profiles').insert({
      id: userId,
      requests_today: 0,
      requests_reset_date: new Date().toISOString().split('T')[0],
    })
    return { allowed: true, remaining: 5 }
  }

  if (error || !profile) {
    console.error('Failed to fetch profile:', error)
    return { allowed: false, remaining: 0 }
  }

  const today = new Date().toISOString().split('T')[0]
  const isNewDay = profile.requests_reset_date !== today
  const requestsToday = isNewDay ? 0 : (profile.requests_today ?? 0)

  if (requestsToday >= 5) {
    return { allowed: false, remaining: 0 }
  }

  const newCount = requestsToday + 1

  // Compare-and-swap on the previously-read count/reset-date so concurrent
  // requests can't all read the same "4 remaining" and all get admitted —
  // only the request whose read is still current wins the write.
  const casQuery = supabase
    .from('profiles')
    .update({ requests_today: newCount, requests_reset_date: today })
    .eq('id', userId)

  const { data: updated, error: updateError } = await (
    isNewDay
      ? casQuery.eq('requests_reset_date', profile.requests_reset_date)
      : casQuery.eq('requests_today', requestsToday)
  ).select('requests_today')

  if (updateError || !updated || updated.length === 0) {
    // Lost the race to a concurrent request — treat as exhausted rather than
    // silently over-granting; the next request will read the fresh count.
    return { allowed: false, remaining: 0 }
  }

  return { allowed: true, remaining: 5 - newCount }
}
