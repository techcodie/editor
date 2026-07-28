import type { ContractClause } from '../types/clause'
import type { ContractDate, ContractDateType, ContractEntity, ContractParty } from '../types/contract'

interface MatchRule {
  type: ContractEntity['type']
  label: string
  pattern: RegExp
  confidence: number
}

const ENTITY_RULES: MatchRule[] = [
  { type: 'date', label: 'Date', pattern: /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b/gi, confidence: 0.94 },
  { type: 'amount', label: 'Amount', pattern: /(?:[$EURGBPINR]{1,3}\s*)?\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|EUR|GBP|INR|dollars?|euros?|pounds?|rupees?)\b|[$]\s*\d[\d,]*(?:\.\d{2})?/gi, confidence: 0.9 },
  { type: 'currency', label: 'Currency', pattern: /\b(?:USD|EUR|GBP|INR|dollars?|euros?|pounds?|rupees?)\b/gi, confidence: 0.96 },
  { type: 'address', label: 'Address', pattern: /\b\d{1,6}\s+[A-Za-z0-9.' -]{2,45}\s+(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Boulevard|Blvd|Drive|Dr)\b[^\n,]*/gi, confidence: 0.78 },
  { type: 'reference', label: 'Reference', pattern: /\b(?:Section|Clause|Schedule|Exhibit|Appendix)\s+[A-Z0-9.-]+\b/gi, confidence: 0.94 },
  { type: 'jurisdiction', label: 'Jurisdiction', pattern: /\b(?:laws? of|courts? of|jurisdiction of)\s+([A-Z][A-Za-z .-]{2,50})/g, confidence: 0.84 },
  { type: 'organisation', label: 'Organisation', pattern: /\b[A-Z][A-Za-z&.' -]{2,50}\s+(?:Inc\.?|LLC|Ltd\.?|Limited|Corporation|Corp\.?|Company|LLP|PLC)\b/g, confidence: 0.88 },
]

function collectMatches(text: string, rule: MatchRule): ContractEntity[] {
  return [...text.matchAll(rule.pattern)].flatMap((match) => match.index === undefined ? [] : [{
    id: crypto.randomUUID(), type: rule.type, value: match[0].trim(), label: rule.label,
    confidence: rule.confidence, range: { start: match.index, end: match.index + match[0].trim().length },
  }])
}

export function extractEntities(text: string): ContractEntity[] {
  const entities = ENTITY_RULES.flatMap((rule) => collectMatches(text, rule))
  return entities.filter((entity, index) => !entities.slice(0, index).some((item) =>
    item.type === entity.type && item.range.start === entity.range.start && item.range.end === entity.range.end,
  ))
}

function partyType(name: string): ContractParty['entityType'] {
  if (/\b(?:Inc\.?|LLC|Ltd\.?|Limited|Corporation|Corp\.?|Company|LLP|PLC)\b/.test(name)) return 'organisation'
  if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(name)) return 'person'
  return 'unknown'
}

export function extractParties(text: string): ContractParty[] {
  const results: ContractParty[] = []
  const patterns = [
    /\bbetween\s+([^\n,;]{2,80}?)\s+and\s+([^\n,;]{2,80})(?:[,.]|\n|$)/gi,
    /\b([A-Z][A-Za-z0-9&.' -]{2,80})\s*\((?:the\s+)?["']?([A-Za-z][A-Za-z -]{1,30})["']?\)/g,
  ]
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      if (match.index === undefined) continue
      const values = pattern === patterns[0]
        ? [{ name: match[1], role: 'Party' }, { name: match[2], role: 'Party' }]
        : [{ name: match[1], role: match[2] }]
      for (const value of values) {
        const originalName = value.name.trim()
        const roleMatch = originalName.match(/\((?:the\s+)?["']?([^)'"']+)["']?\)\s*[.]?$/i)
        const name = originalName
          .replace(/^(?:this\s+)?agreement\s+is\s+(?:made\s+)?between\s+/i, '')
          .replace(/\s*\([^)]*\)\s*[.]?$/, '')
          .trim()
        const role = value.role === 'Party' && roleMatch ? roleMatch[1].trim() : value.role.trim()
        const offset = match[0].indexOf(value.name)
        if (!name || results.some((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) continue
        results.push({ id: crypto.randomUUID(), name, role, entityType: partyType(name), confidence: 0.82, range: { start: match.index + Math.max(0, offset), end: match.index + Math.max(0, offset) + name.length } })
      }
    }
  }
  return results
}

const DATE_LABELS: Array<{ type: ContractDateType; pattern: RegExp; label: string }> = [
  { type: 'effective', pattern: /effective date/i, label: 'Effective Date' },
  { type: 'execution', pattern: /execution date|executed on|dated as of/i, label: 'Execution Date' },
  { type: 'expiry', pattern: /expir(?:y|es|ation)|end date/i, label: 'Expiry Date' },
  { type: 'renewal', pattern: /renewal date|renews? on/i, label: 'Renewal Date' },
  { type: 'notice-period', pattern: /notice period|prior written notice/i, label: 'Notice Period' },
  { type: 'termination-window', pattern: /termination window|terminate.*days/i, label: 'Termination Window' },
  { type: 'payment-deadline', pattern: /payment[\s\S]{0,120}(?:due|within)|\bpay[\s\S]{0,100}(?:due|within)|invoice[\s\S]{0,120}(?:due|within)/i, label: 'Payment Deadline' },
]

function normalizeDate(value: string): string | undefined {
  const iso = value.match(/^\d{4}-\d{2}-\d{2}$/)?.[0]
  if (iso) return iso
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function extractContractDates(text: string, clauses: ContractClause[], entities: ContractEntity[]): ContractDate[] {
  return entities.filter((entity) => entity.type === 'date').map((entity) => {
    const context = text.slice(Math.max(0, entity.range.start - 90), Math.min(text.length, entity.range.end + 70))
    const definition = DATE_LABELS.find((item) => item.pattern.test(context))
    const clause = clauses.find((item) => item.range.start <= entity.range.start && item.range.end >= entity.range.end)
    return {
      id: crypto.randomUUID(), type: definition?.type ?? 'other', label: definition?.label ?? 'Contract Date',
      value: entity.value, normalizedDate: normalizeDate(entity.value), confidence: definition ? 0.9 : 0.72,
      range: entity.range, clauseId: clause?.id,
    }
  })
}
