export type StandardClauseType =
  | 'termination'
  | 'confidentiality'
  | 'indemnity'
  | 'limitation-of-liability'
  | 'payment'
  | 'warranty'
  | 'intellectual-property'
  | 'force-majeure'
  | 'governing-law'
  | 'assignment'
  | 'data-privacy'
  | 'general'

export type ClauseType = StandardClauseType | `custom:${string}`

export interface ContractTextRange {
  start: number
  end: number
}

export interface ContractClause {
  id: string
  title: string
  text: string
  type: ClauseType
  confidence: number
  range: ContractTextRange
  order: number
  source: 'heading' | 'paragraph' | 'numbered-section'
}

export interface ClauseClassificationRule {
  type: ClauseType
  label: string
  keywords: string[]
}

export const CLAUSE_TYPE_LABELS: Record<StandardClauseType, string> = {
  termination: 'Termination',
  confidentiality: 'Confidentiality',
  indemnity: 'Indemnity',
  'limitation-of-liability': 'Limitation of Liability',
  payment: 'Payment',
  warranty: 'Warranty',
  'intellectual-property': 'Intellectual Property',
  'force-majeure': 'Force Majeure',
  'governing-law': 'Governing Law',
  assignment: 'Assignment',
  'data-privacy': 'Data Privacy',
  general: 'General',
}
