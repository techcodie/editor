import { CLAUSE_TYPE_LABELS, type ClauseClassificationRule, type ContractClause, type StandardClauseType } from '../types/clause'

const DEFAULT_RULES: ClauseClassificationRule[] = [
  { type: 'termination', label: CLAUSE_TYPE_LABELS.termination, keywords: ['terminate', 'termination', 'notice period', 'breach'] },
  { type: 'confidentiality', label: CLAUSE_TYPE_LABELS.confidentiality, keywords: ['confidential', 'non-disclosure', 'proprietary information'] },
  { type: 'indemnity', label: CLAUSE_TYPE_LABELS.indemnity, keywords: ['indemnify', 'indemnification', 'hold harmless'] },
  { type: 'limitation-of-liability', label: CLAUSE_TYPE_LABELS['limitation-of-liability'], keywords: ['limitation of liability', 'aggregate liability', 'consequential damages'] },
  { type: 'payment', label: CLAUSE_TYPE_LABELS.payment, keywords: ['payment', 'invoice', 'fees', 'net 30', 'net 45', 'net 60'] },
  { type: 'warranty', label: CLAUSE_TYPE_LABELS.warranty, keywords: ['warranty', 'warrants', 'as is'] },
  { type: 'intellectual-property', label: CLAUSE_TYPE_LABELS['intellectual-property'], keywords: ['intellectual property', 'copyright', 'patent', 'trademark', 'ownership'] },
  { type: 'force-majeure', label: CLAUSE_TYPE_LABELS['force-majeure'], keywords: ['force majeure', 'beyond reasonable control', 'act of god'] },
  { type: 'governing-law', label: CLAUSE_TYPE_LABELS['governing-law'], keywords: ['governing law', 'jurisdiction', 'laws of'] },
  { type: 'assignment', label: CLAUSE_TYPE_LABELS.assignment, keywords: ['assign', 'assignment', 'successors'] },
  { type: 'data-privacy', label: CLAUSE_TYPE_LABELS['data-privacy'], keywords: ['personal data', 'data protection', 'privacy', 'processor', 'controller'] },
]

function classify(clause: ContractClause, rules: ClauseClassificationRule[]): ContractClause {
  const normalized = `${clause.title}\n${clause.text}`.toLocaleLowerCase()
  let best: ClauseClassificationRule | undefined
  let bestHits = 0
  for (const rule of rules) {
    const hits = rule.keywords.filter((keyword) => normalized.includes(keyword.toLocaleLowerCase())).length
    if (hits > bestHits) { best = rule; bestHits = hits }
  }
  if (!best) return { ...clause, type: 'general', confidence: clause.confidence || 0.4 }
  const confidence = Math.min(0.98, 0.68 + bestHits * 0.1 + (clause.title.toLocaleLowerCase().includes(best.label.toLocaleLowerCase()) ? 0.1 : 0))
  return { ...clause, type: best.type, confidence }
}

export function classifyClauses(clauses: ContractClause[], customRules: ClauseClassificationRule[] = []): ContractClause[] {
  return clauses.map((clause) => classify(clause, [...customRules, ...DEFAULT_RULES]))
}

export function standardClauseTypes(): StandardClauseType[] {
  return Object.keys(CLAUSE_TYPE_LABELS) as StandardClauseType[]
}
