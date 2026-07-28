import type { ContractClause } from '../types/clause'
import type { ContractDate, ContractObligation, ContractParty, ObligationPriority, ObligationStatus } from '../types/contract'

const OBLIGATION_PATTERN = /([^.!?\n]{0,100}?)\b(shall|must|is required to|agrees to|will)\b\s+([^.!?\n]{3,240})[.!?]?/gi

function resolveParty(subject: string, parties: ContractParty[]): string {
  const normalized = subject.toLocaleLowerCase()
  return parties.find((party) => normalized.includes(party.name.toLocaleLowerCase()) || normalized.includes(party.role.toLocaleLowerCase()))?.name
    ?? subject.trim().split(/[,;:]/).at(-1)?.trim().slice(-80)
    ?? 'Unassigned party'
}

function priorityFor(action: string): ObligationPriority {
  if (/immediately|material breach|security incident|regulatory/i.test(action)) return 'critical'
  if (/within\s+(?:[1-9]|1\d|2\d)\s+days|terminate|indemn/i.test(action)) return 'high'
  if (/pay|deliver|provide|maintain|notify/i.test(action)) return 'medium'
  return 'low'
}

function statusFor(dueDate?: string): ObligationStatus {
  if (!dueDate) return 'unknown'
  const timestamp = Date.parse(dueDate)
  if (Number.isNaN(timestamp)) return 'unknown'
  const days = (timestamp - Date.now()) / 86_400_000
  if (days < 0) return 'overdue'
  if (days <= 30) return 'due-soon'
  return 'open'
}

function resolveDueDate(statement: string, date?: ContractDate): string | undefined {
  if (!date?.normalizedDate) return date?.value
  const offset = Number(statement.match(/\bwithin\s+(\d{1,3})\s+(?:calendar\s+|business\s+)?days?\s+(?:of|after|following)\b/i)?.[1])
  if (!Number.isFinite(offset) || offset <= 0) return date.normalizedDate
  const [year, month, day] = date.normalizedDate.split('-').map(Number)
  const deadline = new Date(Date.UTC(year, month - 1, day + offset))
  return deadline.toISOString().slice(0, 10)
}

export function extractObligations(clauses: ContractClause[], parties: ContractParty[], dates: ContractDate[]): ContractObligation[] {
  return clauses.flatMap((clause) => [...clause.text.matchAll(OBLIGATION_PATTERN)].flatMap((match) => {
    if (match.index === undefined) return []
    const action = `${match[2]} ${match[3]}`.trim()
    const start = clause.range.start + match.index
    const due = dates.find((date) => date.clauseId === clause.id && ['payment-deadline', 'expiry', 'notice-period'].includes(date.type))
    const dependencies = [...match[0].matchAll(/\b(?:subject to|after|following|upon)\s+([^,.;]{3,80})/gi)].map((item) => item[1].trim())
    const dueDate = resolveDueDate(match[0], due)
    return [{
      id: crypto.randomUUID(), responsibleParty: resolveParty(match[1], parties), action,
      dueDate, status: statusFor(dueDate),
      priority: priorityFor(action), dependencies, confidence: 0.82, clauseId: clause.id,
      range: { start, end: start + match[0].length },
    }]
  }))
}
