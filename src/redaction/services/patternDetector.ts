import type { CustomDetectionPattern, SensitiveDataDetection, SensitiveDataType } from '../types/detection'
import { SENSITIVE_DATA_LABELS } from '../types/redaction'

interface PatternRule {
  type: SensitiveDataType
  pattern: RegExp
  confidence: number
  reason: string
}

const RULES: PatternRule[] = [
  { type: 'email', pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, confidence: 0.99, reason: 'Matches a valid email address structure.' },
  { type: 'phone', pattern: /(?<!\w)(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]\d{4}(?!\w)/g, confidence: 0.82, reason: 'Matches an international or regional phone number.' },
  { type: 'credit-card', pattern: /\b(?:\d[ -]*?){13,19}\b/g, confidence: 0.96, reason: 'Matches a payment card number with a valid checksum.' },
  { type: 'api-key', pattern: /\b(?:sk|pk|api)[-_][A-Za-z0-9_-]{16,}\b/g, confidence: 0.96, reason: 'Matches a common API credential format.' },
  { type: 'password', pattern: /\b(?:password|passwd|pwd)\s*[:=]\s*[^\s,;]{4,}/gi, confidence: 0.95, reason: 'A password label is followed by a value.' },
  { type: 'token', pattern: /\b(?:access[_ -]?token|bearer|secret[_ -]?token)\s*[:=]?\s*[A-Za-z0-9._-]{12,}\b/gi, confidence: 0.94, reason: 'Matches a labeled access token or bearer credential.' },
  { type: 'passport', pattern: /\bpassport(?:\s+(?:no|number))?[.:#\s-]*[A-Z0-9]{6,12}\b/gi, confidence: 0.92, reason: 'A passport label is followed by an identifier.' },
  { type: 'driver-license', pattern: /\b(?:driver'?s?\s+licen[cs]e|dl)(?:\s+(?:no|number))?[.:#\s-]*[A-Z0-9-]{5,18}\b/gi, confidence: 0.9, reason: 'A driving licence label is followed by an identifier.' },
  { type: 'national-id', pattern: /\b(?:national\s+id|aadhaar|ssn)(?:\s+(?:no|number))?[.:#\s-]*[A-Z0-9 -]{6,20}\b/gi, confidence: 0.91, reason: 'A national identity label is followed by an identifier.' },
  { type: 'tax-id', pattern: /\b(?:tax\s+id|tin|pan)(?:\s+(?:no|number))?[.:#\s-]*[A-Z0-9-]{5,18}\b/gi, confidence: 0.88, reason: 'A tax identifier label is followed by an identifier.' },
  { type: 'medical-record', pattern: /\b(?:medical\s+record|patient\s+id|mrn)(?:\s+(?:no|number))?[.:#\s-]*[A-Z0-9-]{4,18}\b/gi, confidence: 0.92, reason: 'A medical record label is followed by an identifier.' },
  { type: 'bank-account', pattern: /\b(?:bank\s+account|account\s+(?:no|number)|iban)[.:#\s-]*[A-Z0-9 -]{8,34}\b/gi, confidence: 0.9, reason: 'A bank account label is followed by account data.' },
  { type: 'address', pattern: /\b\d{1,6}\s+[A-Za-z0-9.' -]{2,40}\s+(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Boulevard|Blvd|Drive|Dr)\b[^\n,]*/gi, confidence: 0.8, reason: 'Matches a street address structure.' },
]

function passesValidation(type: SensitiveDataType, value: string): boolean {
  if (type !== 'credit-card') return true
  const digits = value.replace(/\D/g, '')
  let sum = 0
  let alternate = false
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index])
    if (alternate) { digit *= 2; if (digit > 9) digit -= 9 }
    sum += digit
    alternate = !alternate
  }
  return digits.length >= 13 && sum % 10 === 0
}

function matches(text: string, rule: PatternRule): SensitiveDataDetection[] {
  return [...text.matchAll(rule.pattern)].flatMap((match) => {
    if (match.index === undefined || !passesValidation(rule.type, match[0])) return []
    return [{
      id: crypto.randomUUID(), type: rule.type, label: SENSITIVE_DATA_LABELS[rule.type],
      value: match[0], range: { from: match.index, to: match.index + match[0].length },
      confidence: rule.confidence, source: 'regex' as const, reason: rule.reason,
    }]
  })
}

export function detectPatterns(text: string, customPatterns: CustomDetectionPattern[] = []): SensitiveDataDetection[] {
  const builtIn = RULES.flatMap((rule) => matches(text, rule))
  const custom = customPatterns.flatMap((rule) => {
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags.includes('g') ? rule.pattern.flags : `${rule.pattern.flags}g`)
    return [...text.matchAll(pattern)].flatMap((match) => match.index === undefined ? [] : [{
    id: crypto.randomUUID(), type: 'custom' as const, label: rule.label, value: match[0],
    range: { from: match.index, to: match.index + match[0].length }, confidence: 1,
    source: 'rule' as const, reason: `Matches the custom policy “${rule.label}”.`,
    }])
  })
  return [...builtIn, ...custom]
}
