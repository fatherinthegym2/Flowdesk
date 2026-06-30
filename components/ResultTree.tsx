'use client'

import type { DecomposeResponse } from '@/types'

interface Props {
  data: DecomposeResponse
}

function PriorityBadge({ priority }: { priority: string | number }) {
  const colorMap: Record<string, string> = {
    MUST: '#C1714A',
    SHOULD: '#d4956e',
    COULD: '#e8b99a',
    WONT: '#ccc',
  }

  if (typeof priority === 'string') {
    return (
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
        style={{ backgroundColor: colorMap[priority] ?? '#C1714A' }}
      >
        {priority}
      </span>
    )
  }

  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
      style={{ backgroundColor: '#C1714A' }}
    >
      {priority}
    </span>
  )
}

export default function ResultTree({ data }: Props) {
  const { framework, frameworkReason, result } = data

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium" style={{ color: '#C1714A' }}>
        {framework} — {frameworkReason}
      </div>

      <h2 className="font-semibold text-gray-900 text-lg">{result.goal}</h2>

      <div className="space-y-3">
        {result.objectives.map((obj, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-3">
              <PriorityBadge priority={obj.priority} />
              <span className="font-medium text-gray-900">{obj.title}</span>
            </div>
            {obj.steps.length > 0 && (
              <ul className="pl-4 space-y-1">
                {obj.steps.map((step, j) => (
                  <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                    {step.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
