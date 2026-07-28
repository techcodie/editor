import type { ContractClause } from '../types/clause'
import type { ContractDate, RenewalTerm } from '../types/contract'

function daysFrom(text: string, label: RegExp): number | undefined {
  const match = text.match(new RegExp(`(\\d{1,3})\\s+(?:calendar\\s+|business\\s+)?days?[^.]{0,50}${label.source}|${label.source}[^.]{0,50}(\\d{1,3})\\s+(?:calendar\\s+|business\\s+)?days?`, 'i'))
  const value = Number(match?.[1] ?? match?.[2])
  return Number.isFinite(value) && value > 0 ? value : undefined
}

export function extractRenewalTerms(clauses: ContractClause[], dates: ContractDate[]): RenewalTerm[] {
  return clauses.flatMap((clause) => {
    if (!/renew|term|expir|notice|terminate/i.test(`${clause.title}\n${clause.text}`)) return []
    const automatic = /automatic(?:ally)?\s+renew|auto-renew/i.test(clause.text)
    const manual = /mutual written agreement|may renew|option to renew/i.test(clause.text)
    const expiry = dates.find((date) => date.clauseId === clause.id && date.type === 'expiry')
    const renewal = dates.find((date) => date.clauseId === clause.id && date.type === 'renewal')
    return [{
      id: crypto.randomUUID(), type: automatic ? 'automatic' as const : manual ? 'manual' as const : expiry ? 'fixed-term' as const : 'unknown' as const,
      renewalDate: renewal?.normalizedDate ?? renewal?.value,
      expiryDate: expiry?.normalizedDate ?? expiry?.value,
      noticeDays: daysFrom(clause.text, /notice/),
      terminationWindowDays: daysFrom(clause.text, /terminat/),
      description: clause.text.slice(0, 280), confidence: automatic || manual || expiry ? 0.86 : 0.62,
      clauseId: clause.id,
    }]
  })
}
