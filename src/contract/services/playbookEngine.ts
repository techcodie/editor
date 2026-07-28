import type { ContractClause } from '../types/clause'
import type { ContractPlaybook, PlaybookDeviation } from '../types/contract'

export function validatePlaybook(clauses: ContractClause[], playbook?: ContractPlaybook | null): PlaybookDeviation[] {
  if (!playbook) return []
  return playbook.rules.flatMap((rule) => {
    const matching = clauses.filter((clause) => clause.type === rule.clauseType)
    const deviations: PlaybookDeviation[] = []
    if (rule.required && matching.length === 0) deviations.push({
      id: crypto.randomUUID(), ruleId: rule.id, type: 'missing-required-clause',
      title: `Missing ${String(rule.clauseType).replaceAll('-', ' ')} clause`,
      description: rule.description || `The configured playbook requires this clause type.`,
      clauseIds: [], severity: 'high',
    })
    if (rule.forbidden && matching.length > 0) deviations.push({
      id: crypto.randomUUID(), ruleId: rule.id, type: 'forbidden-clause',
      title: `Playbook excludes ${String(rule.clauseType).replaceAll('-', ' ')}`,
      description: rule.description || 'This clause type is excluded by the configured playbook.',
      clauseIds: matching.map((clause) => clause.id), severity: 'critical',
    })
    if (rule.recommendedLanguage?.trim()) {
      const normalized = rule.recommendedLanguage.trim().toLocaleLowerCase()
      const aligned = matching.some((clause) => clause.text.toLocaleLowerCase().includes(normalized))
      if (matching.length > 0 && !aligned) deviations.push({
        id: crypto.randomUUID(), ruleId: rule.id, type: 'recommended-language',
        title: `Review ${String(rule.clauseType).replaceAll('-', ' ')} language`,
        description: 'The clause does not contain the language configured by this playbook.',
        clauseIds: matching.map((clause) => clause.id), severity: 'medium',
      })
    }
    return deviations
  })
}
