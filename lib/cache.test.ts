import { describe, it, expect } from 'vitest'
import { normalizeQuery, hashQuery } from './cache'

describe('normalizeQuery', () => {
  it('lowercases the query', () => {
    expect(normalizeQuery('Hello World')).toBe('hello world')
  })

  it('trims leading/trailing whitespace', () => {
    expect(normalizeQuery('  hello  ')).toBe('hello')
  })

  it('collapses internal repeated whitespace to a single space', () => {
    expect(normalizeQuery('hello   world')).toBe('hello world')
  })

  it('collapses newlines/tabs into a single space', () => {
    expect(normalizeQuery('hello\n\tworld')).toBe('hello world')
  })
})

describe('hashQuery', () => {
  it('produces the same hash for case/whitespace variants of the same text', () => {
    const a = hashQuery('Хочу выучить   английский')
    const b = hashQuery('  хочу выучить английский  ')
    expect(a).toBe(b)
  })

  it('produces different hashes for genuinely different queries', () => {
    const a = hashQuery('learn guitar')
    const b = hashQuery('learn piano')
    expect(a).not.toBe(b)
  })

  it('returns a 32-char hex md5 digest', () => {
    expect(hashQuery('test')).toMatch(/^[a-f0-9]{32}$/)
  })
})
