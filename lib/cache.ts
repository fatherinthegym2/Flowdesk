import crypto from 'crypto'

/**
 * Normalizes a query for cache-key purposes: case-insensitive, and all
 * whitespace (leading, trailing, and internal runs) collapsed to a single
 * space, so "Hi   there" and "hi there" hit the same cache entry.
 */
export function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ')
}

export function hashQuery(query: string): string {
  return crypto.createHash('md5').update(normalizeQuery(query)).digest('hex')
}
