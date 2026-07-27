import type { DocumentModel } from '../../intelligence/types/documentModel'
import type { ComplianceFinding, ComplianceSeverity } from '../types/compliance'

interface ClauseRule {
  id: string
  title: string
  description: string
  severity: ComplianceSeverity
  recommendation: string
  suggestedText: string
  applies: (text: string) => boolean
  present: (text: string) => boolean
}

const GOVERNED_DOCUMENT_PATTERN = /\b(?:agreement|contract|policy|procedure|terms|party|parties|shall)\b/i

const CLAUSE_RULES: ClauseRule[] = [
  {
    id: 'purpose-scope',
    title: 'Purpose or scope clause not detected',
    description: 'The document appears governed but does not clearly state its purpose or scope.',
    severity: 'medium',
    recommendation: 'Add a concise purpose or scope clause that defines what the document covers.',
    suggestedText: 'Purpose and Scope\nThis document applies to [scope] and establishes [objective].',
    applies: (text) => GOVERNED_DOCUMENT_PATTERN.test(text),
    present: (text) => /\b(?:purpose|scope|objective|background)\b/i.test(text),
  },
  {
    id: 'roles-responsibilities',
    title: 'Responsibilities clause not detected',
    description: 'The document does not clearly identify accountable roles or responsibilities.',
    severity: 'medium',
    recommendation: 'Identify each responsible party or role and describe its obligations.',
    suggestedText: 'Roles and Responsibilities\n[Responsible party] is accountable for [obligation].',
    applies: (text) => GOVERNED_DOCUMENT_PATTERN.test(text),
    present: (text) => /\b(?:responsibilit(?:y|ies)|obligations?|duties|accountable)\b/i.test(text),
  },
  {
    id: 'lifecycle',
    title: 'Document lifecycle clause not detected',
    description: 'No effective date, review period, termination, or expiry mechanism was detected.',
    severity: 'medium',
    recommendation: 'State when the document takes effect and how it is reviewed, renewed, or terminated.',
    suggestedText: 'Lifecycle\nThis document takes effect on [effective date] and will be reviewed [review frequency] by [owner].',
    applies: (text) => GOVERNED_DOCUMENT_PATTERN.test(text),
    present: (text) => /\b(?:effective date|review date|renewal|termination|terminate|expiry|expiration)\b/i.test(text),
  },
  {
    id: 'data-handling',
    title: 'Data handling safeguards not detected',
    description: 'The document discusses confidential, personal, or customer data without an evident handling clause.',
    severity: 'high',
    recommendation: 'Add organization-approved requirements for access, use, retention, and disposal of the data.',
    suggestedText: 'Data Handling\nAccess to [data category] is limited to [authorized roles]. The data must be retained for [period] and disposed of using [approved method].',
    applies: (text) => /\b(?:confidential|personal data|personal information|customer data|sensitive data)\b/i.test(text),
    present: (text) => /\b(?:data protection|data handling|retention|confidentiality|privacy)\b/i.test(text),
  },
]

export function analyzeClauses(model: DocumentModel): ComplianceFinding[] {
  return CLAUSE_RULES.flatMap((rule) => {
    if (!rule.applies(model.text) || rule.present(model.text)) return []
    return [{
      id: crypto.randomUUID(),
      type: 'missing-clause',
      title: rule.title,
      description: rule.description,
      severity: rule.severity,
      location: { label: 'Document level' },
      confidence: 0.82,
      recommendation: rule.recommendation,
      suggestedText: rule.suggestedText,
    } satisfies ComplianceFinding]
  })
}
