import { describe, it, expect } from 'vitest'
import { isValidDecomposeResponse } from './validate-result'

function validResponse() {
  return {
    framework: 'MoSCoW',
    frameworkReason: 'personal goal',
    result: {
      goal: 'Learn guitar',
      objectives: [
        { title: 'Buy a guitar', priority: 'MUST', steps: [{ title: 'Pick a shop' }] },
      ],
    },
  }
}

describe('isValidDecomposeResponse', () => {
  it('accepts a well-formed response', () => {
    expect(isValidDecomposeResponse(validResponse())).toBe(true)
  })

  it('accepts a numeric (ICE/RICE) priority', () => {
    const r = validResponse()
    r.result.objectives[0].priority = 7.3 as unknown as string
    expect(isValidDecomposeResponse(r)).toBe(true)
  })

  it('accepts an objective with no steps', () => {
    const r = validResponse()
    r.result.objectives[0].steps = []
    expect(isValidDecomposeResponse(r)).toBe(true)
  })

  it('rejects null/undefined/non-object input', () => {
    expect(isValidDecomposeResponse(null)).toBe(false)
    expect(isValidDecomposeResponse(undefined)).toBe(false)
    expect(isValidDecomposeResponse('a string')).toBe(false)
    expect(isValidDecomposeResponse(42)).toBe(false)
  })

  it('rejects a response missing "result"', () => {
    const r = validResponse() as Partial<ReturnType<typeof validResponse>>
    delete r.result
    expect(isValidDecomposeResponse(r)).toBe(false)
  })

  it('rejects a response with an empty objectives array', () => {
    const r = validResponse()
    r.result.objectives = []
    expect(isValidDecomposeResponse(r)).toBe(false)
  })

  it('rejects an objective missing a title', () => {
    const r = validResponse()
    // @ts-expect-error intentionally malformed for the test
    delete r.result.objectives[0].title
    expect(isValidDecomposeResponse(r)).toBe(false)
  })

  it('rejects an objective with a non-string/non-number priority', () => {
    const r = validResponse()
    r.result.objectives[0].priority = { nested: true } as unknown as string
    expect(isValidDecomposeResponse(r)).toBe(false)
  })

  it('rejects a step that is missing a title', () => {
    const r = validResponse()
    r.result.objectives[0].steps = [{ notTitle: 'oops' } as unknown as { title: string }]
    expect(isValidDecomposeResponse(r)).toBe(false)
  })

  it('rejects a response missing framework/frameworkReason', () => {
    const r = validResponse() as Partial<ReturnType<typeof validResponse>>
    delete r.framework
    expect(isValidDecomposeResponse(r)).toBe(false)
  })
})
