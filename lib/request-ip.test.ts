import { describe, it, expect } from 'vitest'
import { getClientIp } from './request-ip'
import type { NextRequest } from 'next/server'

function reqWithHeaders(headers: Record<string, string>): NextRequest {
  return { headers: new Headers(headers) } as NextRequest
}

describe('getClientIp', () => {
  it('reads the first IP from x-forwarded-for', () => {
    expect(getClientIp(reqWithHeaders({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' }))).toBe('203.0.113.5')
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    expect(getClientIp(reqWithHeaders({ 'x-real-ip': '198.51.100.7' }))).toBe('198.51.100.7')
  })

  it('falls back to "unknown" when neither header is present', () => {
    expect(getClientIp(reqWithHeaders({}))).toBe('unknown')
  })

  it('trims whitespace around the IP', () => {
    expect(getClientIp(reqWithHeaders({ 'x-forwarded-for': '  203.0.113.5  ,10.0.0.1' }))).toBe('203.0.113.5')
  })
})
