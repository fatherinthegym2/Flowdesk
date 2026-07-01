'use client'

import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import type { DecomposeResponse, ViewFormat } from '@/types'
import ResultTree from './ResultTree'

interface Props {
  data: DecomposeResponse
  activeFormat: ViewFormat
  onFormatChange: (format: ViewFormat) => void
  onFormatClickGuest?: () => void
  isAuthenticated: boolean
}

function ListView({ data }: { data: DecomposeResponse }) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium" style={{ color: '#C1714A' }}>
        {data.framework} — {data.frameworkReason}
      </div>
      <h2 className="font-semibold text-gray-900 text-lg">{data.result.goal}</h2>
      <ol className="list-decimal pl-6 space-y-3">
        {data.result.objectives.map((obj, i) => (
          <li key={i} className="text-gray-900">
            <span className="font-medium">{obj.title}</span>
            <span className="ml-2 text-xs text-gray-500">[{obj.priority}]</span>
            {obj.steps.length > 0 && (
              <ul className="list-disc pl-4 mt-1 space-y-1">
                {obj.steps.map((s, j) => (
                  <li key={j} className="text-sm text-gray-600">{s.title}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

const MOSCOW_QUADRANTS = [
  { key: 'MUST',   label: 'MUST',   border: '#e6c9a8', bg: '#fdf6ec', headColor: '#9a6b3f' },
  { key: 'SHOULD', label: 'SHOULD', border: '#e3d8c7', bg: '#fbf8f2', headColor: '#a09588' },
  { key: 'COULD',  label: 'COULD',  border: '#e3d8c7', bg: '#fbf8f2', headColor: '#b0a89e' },
  { key: 'WONT',   label: 'WON\'T', border: '#e3d8c7', bg: '#fbf8f2', headColor: '#bcb4ad' },
]

const NUMERIC_QUADRANTS = [
  { key: 'high',   label: 'ВЫСОКИЙ',   border: '#e6c9a8', bg: '#fdf6ec', headColor: '#9a6b3f' },
  { key: 'medium', label: 'СРЕДНИЙ',   border: '#e3d8c7', bg: '#fbf8f2', headColor: '#a09588' },
  { key: 'low',    label: 'НИЗКИЙ',    border: '#e3d8c7', bg: '#fbf8f2', headColor: '#b0a89e' },
  { key: 'min',    label: 'МИНИМАЛЬНЫЙ', border: '#e3d8c7', bg: '#fbf8f2', headColor: '#bcb4ad' },
]

function ObjectiveCard({ title }: { title: string }) {
  return (
    <div
      style={{
        backgroundColor: '#fff',
        border: '1px solid #ecdcc4',
        borderRadius: 7,
        padding: '8px 11px',
        fontSize: 12,
        color: '#3a342c',
        lineHeight: 1.4,
      }}
    >
      {title}
    </div>
  )
}

function EmptyCell() {
  return (
    <p style={{ fontSize: 12, color: '#bcae9a', fontStyle: 'italic', margin: 0 }}>
      — нет в этом плане
    </p>
  )
}

function MatrixView({ data }: { data: DecomposeResponse }) {
  const isNumeric = data.result.objectives.some((o) => typeof o.priority === 'number')

  let quadrants: { key: string; label: string; border: string; bg: string; headColor: string; items: string[] }[]

  if (isNumeric) {
    const scores = data.result.objectives.map((o) => Number(o.priority) || 0)
    const max = Math.max(...scores)
    const step = max / 4 || 1
    quadrants = NUMERIC_QUADRANTS.map((q, qi) => ({
      ...q,
      items: data.result.objectives
        .filter((o) => {
          const s = Number(o.priority) || 0
          const lo = max - (qi + 1) * step
          const hi = max - qi * step
          return qi === 0 ? s > lo : s > lo && s <= hi
        })
        .map((o) => o.title),
    }))
  } else {
    const keyMap: Record<string, string> = { MUST: 'MUST', SHOULD: 'SHOULD', COULD: 'COULD', WONT: 'WONT', "WON'T": 'WONT' }
    quadrants = MOSCOW_QUADRANTS.map((q) => ({
      ...q,
      items: data.result.objectives
        .filter((o) => (keyMap[String(o.priority).toUpperCase()] ?? String(o.priority).toUpperCase()) === q.key)
        .map((o) => o.title),
    }))
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium" style={{ color: '#C1714A' }}>
        {data.framework} — {data.frameworkReason}
      </div>
      <h2 className="font-semibold text-gray-900 text-lg">{data.result.goal}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {quadrants.map((q) => (
          <div
            key={q.key}
            style={{
              border: `1px solid ${q.border}`,
              backgroundColor: q.bg,
              borderRadius: 11,
              padding: 13,
              minHeight: 120,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-space-mono), monospace',
                fontSize: 11,
                fontWeight: 700,
                color: q.headColor,
                textTransform: 'uppercase',
                margin: 0,
                letterSpacing: '0.04em',
              }}
            >
              {q.label}
            </p>
            {q.items.length > 0
              ? q.items.map((title, i) => <ObjectiveCard key={i} title={title} />)
              : <EmptyCell />}
          </div>
        ))}
      </div>
    </div>
  )
}

function ChartView({ data }: { data: DecomposeResponse }) {
  const maxPriority = Math.max(
    ...data.result.objectives.map((o) => (typeof o.priority === 'number' ? o.priority : 0))
  )
  const isNumeric = maxPriority > 0

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium" style={{ color: '#C1714A' }}>
        {data.framework} — {data.frameworkReason}
      </div>
      <h2 className="font-semibold text-gray-900 text-lg">{data.result.goal}</h2>
      {isNumeric ? (
        <div className="space-y-2">
          {[...data.result.objectives]
            .sort((a, b) => (Number(b.priority) || 0) - (Number(a.priority) || 0))
            .map((obj, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-6 text-right">{Number(obj.priority).toFixed(1)}</span>
                <div className="flex-1">
                  <div
                    className="h-6 rounded-lg text-xs text-white flex items-center px-2 font-medium"
                    style={{
                      width: `${Math.max(10, (Number(obj.priority) / (maxPriority || 1)) * 100)}%`,
                      backgroundColor: '#C1714A',
                    }}
                  >
                    {obj.title}
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="space-y-2">
          {data.result.objectives.map((obj, i) => {
            const priorityOrder: Record<string, number> = { MUST: 4, SHOULD: 3, COULD: 2, WONT: 1 }
            const val = priorityOrder[String(obj.priority)] ?? 2
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-14">{obj.priority}</span>
                <div
                  className="h-6 rounded-lg text-xs text-white flex items-center px-2 font-medium"
                  style={{ width: `${val * 25}%`, backgroundColor: '#C1714A' }}
                >
                  {obj.title}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const FORMATS: { key: ViewFormat; label: string }[] = [
  { key: 'tree',   label: 'Дерево' },
  { key: 'list',   label: 'Список' },
  { key: 'matrix', label: 'Матрица' },
  { key: 'chart',  label: 'График' },
]

export default function FormatTabs({
  data,
  activeFormat,
  onFormatChange,
  onFormatClickGuest,
  isAuthenticated,
}: Props) {
  function handleFormatClick(format: ViewFormat) {
    if (!isAuthenticated) {
      onFormatClickGuest?.()
      return
    }
    onFormatChange(format)
  }

  return (
    <div className="space-y-4">
      <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
        {FORMATS.map(({ key, label }) => {
          const isActive = activeFormat === key
          return (
            <button
              key={key}
              onClick={() => handleFormatClick(key)}
              style={{
                fontSize: 12,
                fontWeight: 500,
                padding: '6px 13px',
                borderRadius: 8,
                border: `1px solid ${isActive ? '#b06a4f' : '#e3d8c7'}`,
                backgroundColor: isActive ? '#b06a4f' : '#fff',
                color: isActive ? '#fff' : '#6f6a62',
                cursor: 'pointer',
                fontFamily: 'var(--font-hanken), sans-serif',
                transition: 'all 0.15s',
                lineHeight: 1,
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {activeFormat === 'tree'   && <ResultTree data={data} />}
      {activeFormat === 'list'   && <ListView data={data} />}
      {activeFormat === 'matrix' && <MatrixView data={data} />}
      {activeFormat === 'chart'  && <ChartView data={data} />}
    </div>
  )
}
