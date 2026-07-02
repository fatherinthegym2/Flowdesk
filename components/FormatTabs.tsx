'use client'

import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import type { DecomposeResponse, ViewFormat } from '@/types'
import ResultTree from './ResultTree'
import { buildQuadrants, getChartBars } from '@/lib/priority'

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
  const quadrants = buildQuadrants(data.result.objectives)

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
  const bars = getChartBars(data.result.objectives)

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium" style={{ color: '#C1714A' }}>
        {data.framework} — {data.frameworkReason}
      </div>
      <h2 className="font-semibold text-gray-900 text-lg">{data.result.goal}</h2>
      <div className="space-y-2">
        {bars.map((bar, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-14 text-right">{bar.label}</span>
            <div className="flex-1">
              <div
                className="h-6 rounded-lg text-xs text-white flex items-center px-2 font-medium"
                style={{ width: `${bar.widthPercent}%`, backgroundColor: '#C1714A' }}
              >
                {bar.title}
              </div>
            </div>
          </div>
        ))}
      </div>
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
