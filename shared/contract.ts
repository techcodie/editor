export interface ContractAiSummaryRequest {
  document: string
  clauses: Array<{ id: string; title: string; type: string; text: string }>
  obligations: Array<{ id: string; responsibleParty: string; action: string; dueDate?: string }>
  dates: Array<{ id: string; type: string; value: string }>
  risks: Array<{ id: string; title: string; level: string; reason: string }>
  missingSections: string[]
}

export interface ContractAiSummaryResponse {
  executiveSummary: string
  keyObligationIds: string[]
  majorRiskIds: string[]
  importantDateIds: string[]
  criticalClauseIds: string[]
  missingSections: string[]
}
