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

function MatrixView({ data }: { data: DecomposeResponse }) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium" style={{ color: '#C1714A' }}>
        {data.framework} — {data.frameworkReason}
      </div>
      <h2 className="font-semibold text-gray-900 text-lg">{data.result.goal}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-4 font-medium text-gray-700">Цель / Задача</th>
              <th className="text-left py-2 pr-4 font-medium text-gray-700">Приоритет</th>
              <th className="text-left py-2 font-medium text-gray-700">Подшаги</th>
            </tr>
          </thead>
          <tbody>
            {data.result.objectives.map((obj, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium text-gray-900">{obj.title}</td>
                <td className="py-2 pr-4">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: '#C1714A' }}
                  >
                    {obj.priority}
                  </span>
                </td>
                <td className="py-2 text-gray-600">
                  {obj.steps.map((s) => s.title).join(', ') || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

const FORMATS: { key: ViewFormat; labelKey: string }[] = [
  { key: 'tree', labelKey: 'result.format_tree' },
  { key: 'list', labelKey: 'result.format_list' },
  { key: 'matrix', labelKey: 'result.format_matrix' },
  { key: 'chart', labelKey: 'result.format_chart' },
]

export default function FormatTabs({
  data,
  activeFormat,
  onFormatChange,
  onFormatClickGuest,
  isAuthenticated,
}: Props) {
  const { t } = useTranslation('common')

  function handleFormatClick(format: ViewFormat) {
    if (!isAuthenticated) {
      onFormatClickGuest?.()
      return
    }
    onFormatChange(format)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {FORMATS.map(({ key, labelKey }) => (
          <button
            key={key}
            onClick={() => handleFormatClick(key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeFormat === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {activeFormat === 'tree' && <ResultTree data={data} />}
      {activeFormat === 'list' && <ListView data={data} />}
      {activeFormat === 'matrix' && <MatrixView data={data} />}
      {activeFormat === 'chart' && <ChartView data={data} />}
    </div>
  )
}
