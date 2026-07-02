import { describe, it, expect } from 'vitest'
import { isNumericPriority, buildQuadrants, getChartBars } from './priority'
import type { Objective } from '@/types'

function obj(title: string, priority: string | number, steps: Objective['steps'] = []): Objective {
  return { title, priority, steps }
}

describe('isNumericPriority', () => {
  it('is false for an all-MoSCoW list', () => {
    expect(isNumericPriority([obj('a', 'MUST'), obj('b', 'SHOULD')])).toBe(false)
  })

  it('is true for an all-numeric list', () => {
    expect(isNumericPriority([obj('a', 7.2), obj('b', 3.1)])).toBe(true)
  })

  it('is true if even one objective has a numeric priority (mixed list)', () => {
    expect(isNumericPriority([obj('a', 'MUST'), obj('b', 7.2)])).toBe(true)
  })
})

describe('buildQuadrants (MoSCoW)', () => {
  it('buckets each objective into its matching quadrant', () => {
    const objectives = [
      obj('must-1', 'MUST'),
      obj('should-1', 'SHOULD'),
      obj('could-1', 'COULD'),
      obj('wont-1', 'WONT'),
    ]
    const quadrants = buildQuadrants(objectives)
    expect(quadrants.find((q) => q.key === 'MUST')?.items).toEqual(['must-1'])
    expect(quadrants.find((q) => q.key === 'SHOULD')?.items).toEqual(['should-1'])
    expect(quadrants.find((q) => q.key === 'COULD')?.items).toEqual(['could-1'])
    expect(quadrants.find((q) => q.key === 'WONT')?.items).toEqual(['wont-1'])
  })

  it("accepts the apostrophe'd \"WON'T\" spelling as WONT", () => {
    const quadrants = buildQuadrants([obj('a', "WON'T")])
    expect(quadrants.find((q) => q.key === 'WONT')?.items).toEqual(['a'])
  })

  it('is case-insensitive', () => {
    const quadrants = buildQuadrants([obj('a', 'must')])
    expect(quadrants.find((q) => q.key === 'MUST')?.items).toEqual(['a'])
  })

  it('leaves quadrants with no matches empty', () => {
    const quadrants = buildQuadrants([obj('a', 'MUST')])
    expect(quadrants.find((q) => q.key === 'SHOULD')?.items).toEqual([])
  })
})

describe('buildQuadrants (numeric)', () => {
  it('places the highest score in the top quadrant', () => {
    const quadrants = buildQuadrants([obj('top', 10), obj('bottom', 1)])
    expect(quadrants[0].items).toContain('top')
  })

  it('splits scores into 4 roughly even bands based on max', () => {
    // max=8, step=2 -> bands: (6,8], (4,6], (2,4], (0,2]
    const objectives = [obj('a', 8), obj('b', 5), obj('c', 3), obj('d', 1)]
    const quadrants = buildQuadrants(objectives)
    expect(quadrants[0].items).toEqual(['a'])
    expect(quadrants[1].items).toEqual(['b'])
    expect(quadrants[2].items).toEqual(['c'])
    expect(quadrants[3].items).toEqual(['d'])
  })

  // A malformed/mixed-type Claude response (numeric priorities mixed with a
  // non-numeric one) coerces the non-numeric entry to score 0 instead of being
  // rejected. It must still land in the lowest quadrant, not vanish silently
  // (regression test: the lowest bucket's lower bound used to exclude 0 exactly).
  it('coerces a non-numeric priority to 0 and places it in the lowest quadrant, not vanish', () => {
    const quadrants = buildQuadrants([obj('numeric', 8), obj('garbage', 'not-a-number')])
    const allItems = quadrants.flatMap((q) => q.items)
    expect(allItems).toContain('garbage')
    expect(quadrants[quadrants.length - 1].items).toContain('garbage')
  })

  it('never drops an objective whose score sits exactly on a quadrant boundary', () => {
    // max=8, step=2 -> boundaries at 6, 4, 2, 0 exactly
    const objectives = [obj('a', 8), obj('b', 6), obj('c', 4), obj('d', 2), obj('e', 0)]
    const quadrants = buildQuadrants(objectives)
    const allItems = quadrants.flatMap((q) => q.items)
    expect(allItems).toHaveLength(objectives.length)
    for (const o of objectives) expect(allItems).toContain(o.title)
  })
})

describe('getChartBars (MoSCoW)', () => {
  it('maps MUST/SHOULD/COULD/WONT to descending widths', () => {
    const bars = getChartBars([obj('a', 'MUST'), obj('b', 'SHOULD'), obj('c', 'COULD'), obj('d', 'WONT')])
    expect(bars.map((b) => b.widthPercent)).toEqual([100, 75, 50, 25])
  })

  it('defaults an unrecognized priority string to the COULD width (50%)', () => {
    const bars = getChartBars([obj('a', 'UNKNOWN')])
    expect(bars[0].widthPercent).toBe(50)
  })
})

describe('getChartBars (numeric)', () => {
  it('sorts bars by descending priority', () => {
    const bars = getChartBars([obj('low', 2), obj('high', 9)])
    expect(bars.map((b) => b.title)).toEqual(['high', 'low'])
  })

  it('scales width relative to the max, with a 10% floor', () => {
    const bars = getChartBars([obj('a', 10), obj('b', 0.1)])
    expect(bars[0].widthPercent).toBe(100)
    expect(bars[1].widthPercent).toBeGreaterThanOrEqual(10)
  })

  // Documents a known gap (audit finding): a non-numeric priority in an
  // otherwise-numeric list renders "NaN" as the visible bar label.
  it('renders "NaN" as the label for a non-numeric priority mixed into a numeric list', () => {
    const bars = getChartBars([obj('numeric', 8), obj('garbage', 'not-a-number')])
    const garbageBar = bars.find((b) => b.title === 'garbage')
    expect(garbageBar?.label).toBe('NaN')
  })
})
