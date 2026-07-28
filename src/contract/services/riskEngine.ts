import type { ContractClause } from '../types/clause'
import type { ContractComplianceFinding, ContractDate, ContractObligation, ContractRisk, ContractRiskLevel, PlaybookDeviation } from '../types/contract'

function levelFor(score: number): ContractRiskLevel {
  if (score >= 85) return 'critical'
  if (score >= 65) return 'high'
  if (score >= 35) return 'medium'
  return 'low'
}

export function analyzeContractRisks(input: {
  clauses: ContractClause[]
  obligations: ContractObligation[]
  dates: ContractDate[]
  deviations: PlaybookDeviation[]
  complianceFindings?: ContractComplianceFinding[]
}): ContractRisk[] {
  const risks: ContractRisk[] = input.deviations.map((deviation) => {
    const score = deviation.severity === 'critical' ? 92 : deviation.severity === 'high' ? 74 : 48
    return {
      id: crypto.randomUUID(), title: deviation.title, score, level: levelFor(score), confidence: 0.98,
      category: 'playbook' as const, reason: deviation.description,
      supportingClauseIds: deviation.clauseIds, suggestedReview: 'Review this deviation against the active contract playbook.',
    }
  })

  const unassigned = input.obligations.filter((item) => /unassigned/i.test(item.responsibleParty))
  if (unassigned.length) risks.push({
    id: crypto.randomUUID(), title: 'Obligations need ownership', score: Math.min(72, 38 + unassigned.length * 7),
    level: unassigned.length > 3 ? 'high' : 'medium', confidence: 0.8, category: 'obligation',
    reason: `${unassigned.length} detected obligation${unassigned.length === 1 ? '' : 's'} do not map to a detected party.`,
    supportingClauseIds: [...new Set(unassigned.map((item) => item.clauseId))],
    suggestedReview: 'Confirm the responsible party for each obligation.',
  })

  const overdue = input.obligations.filter((item) => item.status === 'overdue')
  if (overdue.length) risks.push({
    id: crypto.randomUUID(), title: 'Past-dated obligations detected', score: 78, level: 'high', confidence: 0.84,
    category: 'date', reason: `${overdue.length} obligation deadline${overdue.length === 1 ? ' appears' : 's appear'} to be in the past.`,
    supportingClauseIds: [...new Set(overdue.map((item) => item.clauseId))], suggestedReview: 'Confirm whether these obligations remain open or were completed.',
  })

  const lowConfidence = input.clauses.filter((clause) => clause.confidence < 0.55)
  if (lowConfidence.length > Math.max(2, input.clauses.length / 2)) risks.push({
    id: crypto.randomUUID(), title: 'Low-confidence clause structure', score: 42, level: 'medium', confidence: 0.74,
    category: 'data-quality', reason: 'Much of the document could not be confidently classified into contract clause types.',
    supportingClauseIds: lowConfidence.map((clause) => clause.id), suggestedReview: 'Review section headings and contract structure before relying on automated results.',
  })

  const compliance = input.complianceFindings?.filter((finding) => ['high', 'critical'].includes(finding.severity)) ?? []
  if (compliance.length) risks.push({
    id: crypto.randomUUID(), title: 'Compliance findings require review', score: compliance.some((item) => item.severity === 'critical') ? 88 : 68,
    level: compliance.some((item) => item.severity === 'critical') ? 'critical' : 'high', confidence: 0.9,
    category: 'compliance', reason: `${compliance.length} high-priority finding${compliance.length === 1 ? '' : 's'} from the existing Compliance Engine overlap this review.`,
    supportingClauseIds: input.clauses.filter((clause) => compliance.some((finding) => finding.location.quote && clause.text.includes(finding.location.quote))).map((clause) => clause.id),
    suggestedReview: 'Open Compliance Review for the underlying findings and recommendations.',
  })
  return risks.toSorted((left, right) => right.score - left.score)
}

export function scoreContractRisk(risks: ContractRisk[]): { score: number; level: ContractRiskLevel } {
  if (!risks.length) return { score: 8, level: 'low' }
  const weighted = risks.slice(0, 8).reduce((total, risk, index) => total + risk.score / (index + 1), 0)
  const divisor = risks.slice(0, 8).reduce((total, _, index) => total + 1 / (index + 1), 0)
  const score = Math.round(Math.min(100, weighted / divisor))
  return { score, level: levelFor(score) }
}
