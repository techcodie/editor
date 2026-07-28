import type { ClauseClassificationRule, ClauseType, ContractClause, ContractTextRange } from './clause'

export interface ContractComplianceFinding {
  id: string
  title: string
  severity: ContractRiskLevel
  location: { quote?: string }
}

export type ContractEntityType =
  | 'party'
  | 'organisation'
  | 'person'
  | 'address'
  | 'date'
  | 'amount'
  | 'currency'
  | 'jurisdiction'
  | 'reference'

export interface ContractEntity {
  id: string
  type: ContractEntityType
  value: string
  label: string
  confidence: number
  range: ContractTextRange
}

export interface ContractParty {
  id: string
  name: string
  role: string
  entityType: 'organisation' | 'person' | 'unknown'
  confidence: number
  range: ContractTextRange
}

export type ContractDateType =
  | 'effective'
  | 'execution'
  | 'expiry'
  | 'renewal'
  | 'notice-period'
  | 'termination-window'
  | 'payment-deadline'
  | 'other'

export interface ContractDate {
  id: string
  type: ContractDateType
  label: string
  value: string
  normalizedDate?: string
  durationDays?: number
  confidence: number
  range: ContractTextRange
  clauseId?: string
}

export type ObligationStatus = 'open' | 'due-soon' | 'overdue' | 'conditional' | 'unknown'
export type ObligationPriority = 'low' | 'medium' | 'high' | 'critical'

export interface ContractObligation {
  id: string
  responsibleParty: string
  action: string
  dueDate?: string
  status: ObligationStatus
  priority: ObligationPriority
  dependencies: string[]
  confidence: number
  clauseId: string
  range: ContractTextRange
}

export interface RenewalTerm {
  id: string
  type: 'automatic' | 'manual' | 'fixed-term' | 'unknown'
  renewalDate?: string
  expiryDate?: string
  noticeDays?: number
  terminationWindowDays?: number
  description: string
  confidence: number
  clauseId?: string
}

export type ContractRiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type ContractRiskCategory =
  | 'playbook'
  | 'obligation'
  | 'date'
  | 'clause'
  | 'compliance'
  | 'data-quality'

export interface ContractRisk {
  id: string
  title: string
  score: number
  level: ContractRiskLevel
  confidence: number
  category: ContractRiskCategory
  reason: string
  supportingClauseIds: string[]
  suggestedReview: string
}

export interface ContractPlaybookRule {
  id: string
  clauseType: ClauseType
  required?: boolean
  forbidden?: boolean
  recommendedLanguage?: string
  description?: string
}

export interface ContractPlaybook {
  id: string
  name: string
  rules: ContractPlaybookRule[]
  customClauseRules?: ClauseClassificationRule[]
}

export type PlaybookDeviationType =
  | 'missing-required-clause'
  | 'forbidden-clause'
  | 'recommended-language'

export interface PlaybookDeviation {
  id: string
  ruleId: string
  type: PlaybookDeviationType
  title: string
  description: string
  clauseIds: string[]
  severity: ContractRiskLevel
}

export interface ContractSummary {
  executiveSummary: string
  keyObligationIds: string[]
  majorRiskIds: string[]
  importantDateIds: string[]
  criticalClauseIds: string[]
  missingSections: string[]
  source: 'local' | 'ai'
}

export interface ContractAnalysis {
  id: string
  documentFingerprint: string
  analyzedAt: number
  clauses: ContractClause[]
  entities: ContractEntity[]
  parties: ContractParty[]
  obligations: ContractObligation[]
  dates: ContractDate[]
  renewals: RenewalTerm[]
  risks: ContractRisk[]
  playbookDeviations: PlaybookDeviation[]
  summary: ContractSummary
  overallRiskScore: number
  overallRiskLevel: ContractRiskLevel
  aiEnhanced: boolean
  aiNotice?: string
}

export type ContractAnalysisStage =
  | 'idle'
  | 'clauses'
  | 'entities'
  | 'obligations'
  | 'dates'
  | 'playbook'
  | 'risk'
  | 'summary'
  | 'ai'
  | 'complete'
  | 'error'
  | 'cancelled'

export interface ContractAnalysisProgress {
  stage: ContractAnalysisStage
  progress: number
  message: string
}

export interface ContractAnalysisOptions {
  signal?: AbortSignal
  onProgress?: (progress: ContractAnalysisProgress) => void
  playbook?: ContractPlaybook | null
  complianceFindings?: ContractComplianceFinding[]
  aiEndpoint?: string
  useCache?: boolean
}

export interface ContractAnalysisHistoryEntry {
  id: string
  analyzedAt: number
  fingerprint: string
  riskScore: number
  riskLevel: ContractRiskLevel
  clauseTypes: ClauseType[]
  clauseCount: number
  obligationCount: number
  analysis: ContractAnalysis
}

export interface ClauseChange {
  id: string
  type: 'added' | 'removed' | 'changed'
  clauseType: ClauseType
  before?: ContractClause
  after?: ContractClause
}

export interface ContractAnalysisComparison {
  clauseChanges: ClauseChange[]
  riskDelta: number
  addedRiskIds: string[]
  removedRiskIds: string[]
  obligationDelta: number
}
