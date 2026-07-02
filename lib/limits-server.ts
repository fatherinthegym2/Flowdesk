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

const GUEST_DAILY_LIMIT = 5

/**
 * Server-side backstop for guest (unauthenticated) requests, keyed by IP.
 * The client-side cookie in lib/limits-client.ts only gates the UI — it's
 * trivially bypassed by clearing cookies or calling the API directly, so
 * this is the actual enforcement. Deliberately more generous than the
 * client's "1 free try" cookie so a single shared/NAT'd IP (office, campus)
 * doesn't lock out every guest behind it after one person tries the app.
 */
export async function checkAndDecrementGuestLimit(
  ip: string
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = await createServiceClient()
  const today = new Date().toISOString().split('T')[0]

  // Ensure a row exists for this IP; no-op if it's already there.
  await supabase
    .from('guest_limits')
    .upsert(
      { ip, requests_today: 0, requests_reset_date: today },
      { onConflict: 'ip', ignoreDuplicates: true }
    )

  const { data: row, error } = await supabase
    .from('guest_limits')
    .select('requests_today, requests_reset_date')
    .eq('ip', ip)
    .single()

  if (error || !row) {
    console.error('Failed to read guest_limits row:', error)
    return { allowed: false, remaining: 0 }
  }

  const isNewDay = row.requests_reset_date !== today
  const requestsToday = isNewDay ? 0 : (row.requests_today ?? 0)

  if (requestsToday >= GUEST_DAILY_LIMIT) {
    return { allowed: false, remaining: 0 }
  }

  const newCount = requestsToday + 1

  const casQuery = supabase
    .from('guest_limits')
    .update({ requests_today: newCount, requests_reset_date: today })
    .eq('ip', ip)

  const { data: updated, error: updateError } = await (
    isNewDay
      ? casQuery.eq('requests_reset_date', row.requests_reset_date)
      : casQuery.eq('requests_today', requestsToday)
  ).select('requests_today')

  if (updateError || !updated || updated.length === 0) {
    return { allowed: false, remaining: 0 }
  }

  return { allowed: true, remaining: GUEST_DAILY_LIMIT - newCount }
}
