export type ComplianceAiSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ComplianceAiFinding {
  id: string
  title: string
  description: string
  severity: ComplianceAiSeverity
  quote?: string
  recommendation: string
}

export interface ComplianceAiRequest {
  document: string
  findings: ComplianceAiFinding[]
}

export interface ComplianceAiRecommendation {
  findingId: string
  title: string
  description: string
  suggestedText?: string
  confidence: number
}

export interface ComplianceAiResponse {
  recommendations: ComplianceAiRecommendation[]
}
