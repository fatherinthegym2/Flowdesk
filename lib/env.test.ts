import { describe, it, expect } from 'vitest'
import { cleanEnv } from './env'

describe('cleanEnv', () => {
  it('returns empty string for undefined', () => {
    expect(cleanEnv(undefined)).toBe('')
  })

  it('leaves a clean value untouched', () => {
    expect(cleanEnv('sk-abc123')).toBe('sk-abc123')
  })

  it('strips a leading BOM', () => {
    expect(cleanEnv('﻿sk-abc123')).toBe('sk-abc123')
  })

  it('strips zero-width spaces anywhere in the value', () => {
    expect(cleanEnv('sk-​abc​123')).toBe('sk-abc123')
  })

  it('trims surrounding whitespace/newlines', () => {
    expect(cleanEnv('  sk-abc123\n')).toBe('sk-abc123')
  })

  it('handles all corruption types combined', () => {
    expect(cleanEnv('﻿  sk-​abc123  \n')).toBe('sk-abc123')
  })
})
