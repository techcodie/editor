import type { DocumentModel } from '../../intelligence/types/documentModel'
import type { FormField } from '../../forms/types/field'

export type ComplianceSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ComplianceFindingType =
  | 'missing-clause'
  | 'empty-section'
  | 'duplicate-clause'
  | 'placeholder-text'
  | 'inconsistent-date'
  | 'undefined-term'
  | 'broken-reference'
  | 'missing-signature'
  | 'long-paragraph'
  | 'missing-required-field'
  | 'duplicate-form-field'
  | 'invalid-field-validation'
  | 'empty-field-label'

export interface ComplianceLocation {
  label: string
  pageNumber?: number
  blockId?: string
  quote?: string
  characterStart?: number
  characterEnd?: number
}

export interface ComplianceFinding {
  id: string
  type: ComplianceFindingType
  title: string
  description: string
  severity: ComplianceSeverity
  location: ComplianceLocation
  confidence: number
  recommendation: string
  suggestedText?: string
}

export interface ComplianceRecommendation {
  id: string
  findingId: string
  title: string
  description: string
  suggestedText?: string
  confidence: number
  source: 'rule' | 'ai'
}

export interface ComplianceSummaryData {
  total: number
  low: number
  medium: number
  high: number
  critical: number
  missingClauses: number
}

export interface ComplianceReport {
  id: string
  documentId: string
  analyzedAt: number
  score: number
  riskLevel: ComplianceSeverity
  findings: ComplianceFinding[]
  recommendations: ComplianceRecommendation[]
  summary: ComplianceSummaryData
  aiEnhanced: boolean
  aiNotice?: string
}

export type ComplianceProgressStage =
  | 'idle'
  | 'preparing'
  | 'rules'
  | 'clauses'
  | 'scoring'
  | 'ai'
  | 'complete'
  | 'error'
  | 'cancelled'

export interface ComplianceProgress {
  stage: ComplianceProgressStage
  progress: number
  message: string
}

export interface ComplianceEngineOptions {
  signal?: AbortSignal
  onProgress?: (progress: ComplianceProgress) => void
  aiEndpoint?: string
  useCache?: boolean
}

export interface ComplianceAnalysisInput {
  model: DocumentModel
  documentFingerprint: string
  formFields?: FormField[]
}

export type ComplianceSeverityFilter = 'all' | ComplianceSeverity
