import type { Objective } from '@/types'

export const MOSCOW_QUADRANTS = [
  { key: 'MUST',   label: 'MUST',   border: '#e6c9a8', bg: '#fdf6ec', headColor: '#9a6b3f' },
  { key: 'SHOULD', label: 'SHOULD', border: '#e3d8c7', bg: '#fbf8f2', headColor: '#a09588' },
  { key: 'COULD',  label: 'COULD',  border: '#e3d8c7', bg: '#fbf8f2', headColor: '#b0a89e' },
  { key: 'WONT',   label: 'WON\'T', border: '#e3d8c7', bg: '#fbf8f2', headColor: '#bcb4ad' },
] as const

export const NUMERIC_QUADRANTS = [
  { key: 'high',   label: 'ВЫСОКИЙ',      border: '#e6c9a8', bg: '#fdf6ec', headColor: '#9a6b3f' },
  { key: 'medium', label: 'СРЕДНИЙ',      border: '#e3d8c7', bg: '#fbf8f2', headColor: '#a09588' },
  { key: 'low',    label: 'НИЗКИЙ',       border: '#e3d8c7', bg: '#fbf8f2', headColor: '#b0a89e' },
  { key: 'min',    label: 'МИНИМАЛЬНЫЙ',  border: '#e3d8c7', bg: '#fbf8f2', headColor: '#bcb4ad' },
] as const

export function isNumericPriority(objectives: Objective[]) {
  return objectives.some((o) => typeof o.priority === 'number')
}

export function buildQuadrants(objectives: Objective[]) {
  if (isNumericPriority(objectives)) {
    const scores = objectives.map((o) => Number(o.priority) || 0)
    const max = Math.max(...scores)
    const step = max / 4 || 1
    return NUMERIC_QUADRANTS.map((q, qi) => ({
      ...q,
      items: objectives
        .filter((o) => {
          const s = Number(o.priority) || 0
          const lo = max - (qi + 1) * step
          const hi = max - qi * step
          return qi === 0 ? s > lo : s > lo && s <= hi
        })
        .map((o) => o.title),
    }))
  }

  const keyMap: Record<string, string> = { MUST: 'MUST', SHOULD: 'SHOULD', COULD: 'COULD', WONT: 'WONT', "WON'T": 'WONT' }
  return MOSCOW_QUADRANTS.map((q) => ({
    ...q,
    items: objectives
      .filter((o) => (keyMap[String(o.priority).toUpperCase()] ?? String(o.priority).toUpperCase()) === q.key)
      .map((o) => o.title),
  }))
}

const MOSCOW_ORDER: Record<string, number> = { MUST: 4, SHOULD: 3, COULD: 2, WONT: 1 }

export interface ChartBar {
  title: string
  label: string
  widthPercent: number
}

export function getChartBars(objectives: Objective[]): ChartBar[] {
  const maxPriority = Math.max(...objectives.map((o) => (typeof o.priority === 'number' ? o.priority : 0)))
  const isNumeric = maxPriority > 0

  if (isNumeric) {
    return [...objectives]
      .sort((a, b) => (Number(b.priority) || 0) - (Number(a.priority) || 0))
      .map((o) => ({
        title: o.title,
        label: Number(o.priority).toFixed(1),
        widthPercent: Math.max(10, (Number(o.priority) / (maxPriority || 1)) * 100),
      }))
  }

  return objectives.map((o) => {
    const val = MOSCOW_ORDER[String(o.priority)] ?? 2
    return {
      title: o.title,
      label: String(o.priority),
      widthPercent: val * 25,
    }
  })
}
