import type { Step, Objective, DecomposeResult } from '@/types'

function isStep(x: unknown): x is Step {
  return typeof x === 'object' && x !== null && typeof (x as Step).title === 'string'
}

function isObjective(x: unknown): x is Objective {
  if (typeof x !== 'object' || x === null) return false
  const o = x as Objective
  if (typeof o.title !== 'string') return false
  if (typeof o.priority !== 'string' && typeof o.priority !== 'number') return false
  if (!Array.isArray(o.steps) || !o.steps.every(isStep)) return false
  return true
}

export function isValidDecomposeResult(x: unknown): x is DecomposeResult {
  if (typeof x !== 'object' || x === null) return false
  const r = x as DecomposeResult
  if (typeof r.goal !== 'string') return false
  if (!Array.isArray(r.objectives) || r.objectives.length === 0) return false
  return r.objectives.every(isObjective)
}

/** Shape Claude is contracted to return: { framework, frameworkReason, result }. */
export function isValidDecomposeResponse(
  x: unknown
): x is { framework: string; frameworkReason: string; result: DecomposeResult } {
  if (typeof x !== 'object' || x === null) return false
  const r = x as { framework?: unknown; frameworkReason?: unknown; result?: unknown }
  return (
    typeof r.framework === 'string' &&
    typeof r.frameworkReason === 'string' &&
    isValidDecomposeResult(r.result)
  )
}
