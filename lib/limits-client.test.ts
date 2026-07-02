import { describe, it, expect, beforeEach } from 'vitest'
import { checkGuestLimit, markGuestLimitUsed, trackGuestVisit } from './limits-client'

function clearCookies() {
  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0].trim()
    if (name) document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
  })
}

describe('limits-client', () => {
  beforeEach(() => {
    clearCookies()
  })

  it('checkGuestLimit is true when the guest has not used their request', () => {
    expect(checkGuestLimit()).toBe(true)
  })

  it('checkGuestLimit is false after markGuestLimitUsed', () => {
    markGuestLimitUsed()
    expect(checkGuestLimit()).toBe(false)
  })

  it('trackGuestVisit sets the visited cookie once', () => {
    expect(document.cookie).not.toContain('fd_guest_visited')
    trackGuestVisit()
    expect(document.cookie).toContain('fd_guest_visited')
  })

  // Documents a known gap (audit finding): this is a client-writable cookie
  // with no server-side check in app/api/decompose/route.ts for guests, so
  // clearing cookies (or calling the API directly) bypasses the "limit"
  // entirely. This test proves the client-side mechanic is trivially resettable
  // by design, not a mistake in this file — the gap is the missing server check.
  it('resets to "unused" the moment cookies are cleared, with nothing server-side to fall back on', () => {
    markGuestLimitUsed()
    expect(checkGuestLimit()).toBe(false)
    clearCookies()
    expect(checkGuestLimit()).toBe(true)
  })
})
