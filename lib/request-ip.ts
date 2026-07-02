import type { NextRequest } from 'next/server'

/**
 * Best-effort client IP for server-side rate limiting. Vercel sets
 * x-forwarded-for on every request; falls back to x-real-ip, then a
 * constant so local dev (where neither header is set) doesn't crash —
 * it just means all local requests share one bucket.
 */
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()

  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return 'unknown'
}
