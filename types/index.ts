export interface Step {
  title: string
}

export interface Objective {
  title: string
  priority: string | number
  steps: Step[]
}

export interface DecomposeResult {
  goal: string
  objectives: Objective[]
}

export interface DecomposeResponse {
  framework: string
  frameworkReason: string
  result: DecomposeResult
  remaining?: number
}

export type PendingAction = 'download' | 'drill-down' | 'format-switch' | null
export type ViewFormat = 'tree' | 'list' | 'matrix' | 'chart'
