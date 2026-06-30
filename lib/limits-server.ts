import { createServiceClient } from '@/lib/supabase-server'

export async function checkAndDecrementUserLimit(
  userId: string
): Promise<{ allowed: boolean; remaining: number }> {
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
  let requestsToday = profile.requests_today ?? 0

  if (profile.requests_reset_date !== today) {
    requestsToday = 0
    await supabase
      .from('profiles')
      .update({ requests_today: 0, requests_reset_date: today })
      .eq('id', userId)
  }

  if (requestsToday >= 5) {
    return { allowed: false, remaining: 0 }
  }

  const newCount = requestsToday + 1
  await supabase
    .from('profiles')
    .update({ requests_today: newCount })
    .eq('id', userId)

  return { allowed: true, remaining: 5 - newCount }
}
