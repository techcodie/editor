import type { EditorTextSelection } from '../../lib/editor-api'

export type SensitiveDataType =
  | 'name'
  | 'address'
  | 'email'
  | 'phone'
  | 'national-id'
  | 'passport'
  | 'driver-license'
  | 'bank-account'
  | 'credit-card'
  | 'tax-id'
  | 'medical-record'
  | 'company-secret'
  | 'api-key'
  | 'password'
  | 'token'
  | 'confidential-clause'
  | 'custom'

export type DetectionSource = 'regex' | 'rule' | 'ai' | 'manual'

export interface DetectionRange {
  from: number
  to: number
}

export interface SensitiveDataDetection {
  id: string
  type: SensitiveDataType
  label: string
  value: string
  range: DetectionRange
  confidence: number
  source: DetectionSource
  reason: string
}

export interface CustomDetectionPattern {
  id: string
  label: string
  pattern: RegExp
  classification?: import('./redaction').ClassificationLevel
}

export interface DetectionProgress {
  stage: 'idle' | 'patterns' | 'entities' | 'ai' | 'complete'
  progress: number
  message: string
}

export interface AiDetectionProvider {
  detect(input: { text: string; signal: AbortSignal }): Promise<SensitiveDataDetection[]>
}

export interface DetectionOptions {
  customPatterns?: CustomDetectionPattern[]
  aiProvider?: AiDetectionProvider
  onProgress?: (progress: DetectionProgress) => void
  signal?: AbortSignal
}

export function selectionToDetection(selection: EditorTextSelection): SensitiveDataDetection {
  return {
    id: crypto.randomUUID(),
    type: 'custom',
    label: 'Manual selection',
    value: selection.text,
    range: { from: selection.from, to: selection.to },
    confidence: 1,
    source: 'manual',
    reason: 'Selected manually for redaction review.',
  }
}
