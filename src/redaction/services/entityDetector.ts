import type { SensitiveDataDetection } from '../types/detection'

const ENTITY_RULES = [
  { type: 'name' as const, label: 'Name', pattern: /\b(?:Mr|Mrs|Ms|Dr)\.?[ \t]+[A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+){1,2}\b/g, confidence: 0.77, reason: 'A titled personal name was detected.' },
  { type: 'company-secret' as const, label: 'Company Secret', pattern: /\b(?:internal only|trade secret|proprietary and confidential|do not distribute)\b[^\n.]*/gi, confidence: 0.86, reason: 'The text contains a confidential business marker.' },
  { type: 'confidential-clause' as const, label: 'Confidential Clause', pattern: /\b(?:confidentiality|non-disclosure|non disclosure)\b[^\n]{12,240}/gi, confidence: 0.75, reason: 'A potentially confidential clause was detected.' },
]

export function detectEntities(text: string): SensitiveDataDetection[] {
  return ENTITY_RULES.flatMap((rule) => [...text.matchAll(rule.pattern)].flatMap((match) =>
    match.index === undefined ? [] : [{
      id: crypto.randomUUID(), type: rule.type, label: rule.label, value: match[0].trim(),
      range: { from: match.index, to: match.index + match[0].trim().length },
      confidence: rule.confidence, source: 'rule' as const, reason: rule.reason,
    }],
  ))
}
