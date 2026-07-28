import type { ContractClause } from '../types/clause'
import type { ClauseChange, ContractAnalysis, ContractAnalysisComparison } from '../types/contract'

function clauseKey(clause: ContractClause): string {
  return `${clause.type}:${clause.title.toLocaleLowerCase()}`
}

export function compareContractAnalyses(before: ContractAnalysis, after: ContractAnalysis): ContractAnalysisComparison {
  const previous = new Map(before.clauses.map((clause) => [clauseKey(clause), clause]))
  const current = new Map(after.clauses.map((clause) => [clauseKey(clause), clause]))
  const clauseChanges = [...new Set([...previous.keys(), ...current.keys()])].flatMap<ClauseChange>((key) => {
    const left = previous.get(key)
    const right = current.get(key)
    if (!left && right) return [{ id: crypto.randomUUID(), type: 'added' as const, clauseType: right.type, after: right }]
    if (left && !right) return [{ id: crypto.randomUUID(), type: 'removed' as const, clauseType: left.type, before: left }]
    if (left && right && left.text !== right.text) return [{ id: crypto.randomUUID(), type: 'changed' as const, clauseType: right.type, before: left, after: right }]
    return []
  })
  const beforeRiskTitles = new Map(before.risks.map((risk) => [risk.title, risk.id]))
  const afterRiskTitles = new Map(after.risks.map((risk) => [risk.title, risk.id]))
  return {
    clauseChanges,
    riskDelta: after.overallRiskScore - before.overallRiskScore,
    addedRiskIds: after.risks.filter((risk) => !beforeRiskTitles.has(risk.title)).map((risk) => risk.id),
    removedRiskIds: before.risks.filter((risk) => !afterRiskTitles.has(risk.title)).map((risk) => risk.id),
    obligationDelta: after.obligations.length - before.obligations.length,
  }
}
