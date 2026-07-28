import type { DocumentModel } from '../../intelligence/types/documentModel'
import type { LayoutBlock } from '../../intelligence/types/layout'
import type {
  ComplianceFinding,
  ComplianceFindingType,
  ComplianceSeverity,
} from '../types/compliance'
import { analyzeFieldDefinitions } from '../../forms/services/validationEngine'
import type { FormField } from '../../forms/types/field'

const PLACEHOLDER_PATTERN = /\b(?:TBD|TODO|FIXME|XXX|lorem ipsum|placeholder)\b|\[(?:insert|add|complete|describe)[^\]]*\]|<[^>]*(?:insert|placeholder)[^>]*>/gi
const DATE_PATTERNS = [
  { id: 'iso', pattern: /\b\d{4}-\d{2}-\d{2}\b/g },
  { id: 'numeric', pattern: /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g },
  { id: 'written', pattern: /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b/gi },
] as const
const REFERENCE_PATTERN = /\b(?:section|clause|article)\s+(\d+(?:\.\d+)*)\b/gi
const NUMBERED_HEADING_PATTERN = /^(\d+(?:\.\d+)*)[.)]?\s+/i
const DEFINITION_PATTERN = /[“"]([^”"]{2,50})[”"]\s+(?:means|shall mean|refers to)\b/gi
const TERM_PATTERN = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}\b/g
const COMMON_TERMS = new Set([
  'United States',
  'Table Of',
  'Terms And',
  'Effective Date',
  'Last Updated',
  'Page Number',
])

function normalize(value: string): string {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

function offsetFor(model: DocumentModel, quote: string): number | undefined {
  const offset = model.text.indexOf(quote)
  return offset >= 0 ? offset : undefined
}

function finding(
  model: DocumentModel,
  type: ComplianceFindingType,
  title: string,
  description: string,
  severity: ComplianceSeverity,
  recommendation: string,
  confidence: number,
  block?: LayoutBlock,
  quoteOverride?: string,
): ComplianceFinding {
  const quote = quoteOverride?.trim() || block?.text.trim() || undefined
  const start = quote ? offsetFor(model, quote) : undefined
  return {
    id: crypto.randomUUID(),
    type,
    title,
    description,
    severity,
    recommendation,
    confidence,
    location: {
      label: block ? `Page ${block.pageNumber}` : 'Document level',
      pageNumber: block?.pageNumber,
      blockId: block?.id,
      quote,
      characterStart: start,
      characterEnd: start === undefined || !quote ? undefined : start + quote.length,
    },
  }
}

function detectPlaceholders(model: DocumentModel): ComplianceFinding[] {
  return model.blocks.flatMap((block) => {
    const matches = [...block.text.matchAll(PLACEHOLDER_PATTERN)]
    return matches.map((match) => finding(
      model,
      'placeholder-text',
      'Unresolved placeholder text',
      `The document still contains “${match[0]}”, which may indicate unfinished content.`,
      'high',
      'Replace or remove the placeholder before the document is finalized.',
      0.99,
      block,
      match[0],
    ))
  })
}

function detectEmptySections(model: DocumentModel): ComplianceFinding[] {
  return model.blocks.flatMap((block, index) => {
    if (block.type !== 'heading') return []
    const next = model.blocks[index + 1]
    if (next && next.pageNumber === block.pageNumber && next.type !== 'heading') return []
    return [finding(
      model,
      'empty-section',
      'Empty section',
      `The “${block.text}” heading has no substantive content beneath it.`,
      'medium',
      'Add approved content to this section or remove the unused heading.',
      0.92,
      block,
    )]
  })
}

function detectDuplicates(model: DocumentModel): ComplianceFinding[] {
  const byText = new Map<string, LayoutBlock[]>()
  for (const block of model.blocks) {
    const key = normalize(block.text)
    if (key.length < 45 || block.type === 'header' || block.type === 'footer') continue
    byText.set(key, [...(byText.get(key) ?? []), block])
  }
  return [...byText.values()].flatMap((blocks) => blocks.slice(1).map((block) => finding(
    model,
    'duplicate-clause',
    'Duplicate clause',
    'This passage substantially duplicates an earlier clause and may create conflicting interpretation.',
    'medium',
    'Confirm whether the duplicate is intentional, then consolidate or remove it.',
    0.96,
    block,
  )))
}

function detectDateConsistency(model: DocumentModel): ComplianceFinding[] {
  const styles = DATE_PATTERNS.flatMap(({ id, pattern }) =>
    [...model.text.matchAll(pattern)].map((match) => ({ id, text: match[0] })),
  )
  const distinctStyles = new Set(styles.map((item) => item.id))
  if (distinctStyles.size <= 1) return []
  const example = styles[1]?.text ?? styles[0]?.text
  return [finding(
    model,
    'inconsistent-date',
    'Inconsistent date formats',
    `Multiple date formats are used in the document, including “${example}”.`,
    'medium',
    'Use one unambiguous date format throughout the document.',
    0.86,
    undefined,
    example,
  )]
}

function detectUndefinedTerms(model: DocumentModel): ComplianceFinding[] {
  const defined = new Set([...model.text.matchAll(DEFINITION_PATTERN)].map((match) => normalize(match[1])))
  const counts = new Map<string, { count: number; text: string }>()
  for (const match of model.text.matchAll(TERM_PATTERN)) {
    if (COMMON_TERMS.has(match[0])) continue
    const key = normalize(match[0])
    const current = counts.get(key) ?? { count: 0, text: match[0] }
    current.count += 1
    counts.set(key, current)
  }
  return [...counts.entries()].flatMap(([key, value]) => {
    if (value.count < 3 || defined.has(key)) return []
    return [finding(
      model,
      'undefined-term',
      'Potentially undefined term',
      `“${value.text}” is used ${value.count} times but no explicit definition was detected.`,
      'low',
      'Define the term on first use or confirm that its meaning is unambiguous.',
      0.68,
      undefined,
      value.text,
    )]
  }).slice(0, 8)
}

function detectBrokenReferences(model: DocumentModel): ComplianceFinding[] {
  const headings = new Set(model.blocks.flatMap((block) => {
    const match = NUMBERED_HEADING_PATTERN.exec(block.text)
    return match ? [match[1]] : []
  }))
  return [...model.text.matchAll(REFERENCE_PATTERN)].flatMap((match) => {
    if (headings.has(match[1])) return []
    return [finding(
      model,
      'broken-reference',
      'Broken internal reference',
      `The document refers to ${match[0]}, but no matching numbered heading was detected.`,
      'high',
      'Update the reference or restore the referenced section before distribution.',
      0.88,
      undefined,
      match[0],
    )]
  }).slice(0, 10)
}

function detectMissingSignature(model: DocumentModel): ComplianceFinding[] {
  const isGovernedDocument = /\b(?:agreement|contract|policy|terms|party|parties|shall)\b/i.test(model.text)
  const hasSignature = /\b(?:signature|signed by|authorized by|approved by)\b/i.test(model.text)
  if (!isGovernedDocument || hasSignature) return []
  return [finding(
    model,
    'missing-signature',
    'Approval or signature block not detected',
    'The document appears to contain governed terms but no approval or signature block was detected.',
    'high',
    'Confirm whether approval is required and add the appropriate signature or authorization block.',
    0.84,
  )]
}

function detectLongParagraphs(model: DocumentModel): ComplianceFinding[] {
  return model.paragraphs.flatMap((block) => {
    const words = block.text.trim().split(/\s+/).length
    if (words < 120) return []
    return [finding(
      model,
      'long-paragraph',
      'Long unreadable paragraph',
      `This paragraph contains ${words} words and may be difficult to review accurately.`,
      words >= 220 ? 'high' : 'medium',
      'Split the paragraph into shorter clauses with descriptive headings or lists.',
      0.95,
      block,
    )]
  })
}

function detectFormRisks(fields: FormField[]): ComplianceFinding[] {
  const byId = new Map(fields.map((field) => [field.id, field]))
  const typeMap = {
    'empty-label': 'empty-field-label',
    'duplicate-field': 'duplicate-form-field',
    'invalid-validation': 'invalid-field-validation',
    'missing-required-field': 'missing-required-field',
  } as const
  return analyzeFieldDefinitions(fields).map((issue) => {
    const field = byId.get(issue.fieldId)
    const title = {
      'empty-label': 'Form field has no label',
      'duplicate-field': 'Duplicate form field',
      'invalid-validation': 'Invalid field validation',
      'missing-required-field': 'No required fields defined',
    }[issue.type]
    return {
      id: crypto.randomUUID(),
      type: typeMap[issue.type],
      title,
      description: issue.message,
      severity: issue.type === 'invalid-validation' || issue.type === 'empty-label' ? 'high' : 'medium',
      location: {
        label: field ? `Form field: ${field.label || field.type}` : 'Form definition',
      },
      confidence: 0.99,
      recommendation: issue.type === 'missing-required-field'
        ? 'Mark fields that are mandatory for a complete response as required.'
        : 'Review the field definition in Form Builder and correct its configuration.',
    }
  })
}

export function detectRisks(model: DocumentModel, formFields: FormField[] = []): ComplianceFinding[] {
  return [
    ...detectPlaceholders(model),
    ...detectEmptySections(model),
    ...detectDuplicates(model),
    ...detectDateConsistency(model),
    ...detectUndefinedTerms(model),
    ...detectBrokenReferences(model),
    ...detectMissingSignature(model),
    ...detectLongParagraphs(model),
    ...detectFormRisks(formFields),
  ]
}
