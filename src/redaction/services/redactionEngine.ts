import { classifyDetection } from './classificationEngine'
import type { SensitiveDataDetection } from '../types/detection'
import type {
  ClassificationLevel,
  RedactionRecord,
  RedactionStyle,
  RedactionSummary,
} from '../types/redaction'

function maskValue(value: string): string {
  const visible = value.replace(/\s/g, '').slice(-4)
  const hiddenLength = Math.max(4, value.replace(/\s/g, '').length - visible.length)
  return `${'•'.repeat(hiddenLength)}${visible}`
}

export function replacementFor(
  detection: SensitiveDataDetection,
  style: RedactionStyle,
): string {
  switch (style) {
    case 'black-box': return '█'.repeat(Math.max(4, Math.min(24, detection.value.length)))
    case 'blur': return '▓'.repeat(Math.max(4, Math.min(24, detection.value.length)))
    case 'mask': return maskValue(detection.value)
    case 'label': return `[${detection.label.toLocaleUpperCase()} REDACTED]`
    case 'temporary-hide': return '[HIDDEN]'
    default: return '[REDACTED]'
  }
}

export function createRedaction(
  detection: SensitiveDataDetection,
  options: {
    actor: string
    style?: RedactionStyle
    classification?: ClassificationLevel
    snapshotId?: string | null
  },
): RedactionRecord {
  const style = options.style ?? 'label'
  const createdAt = Date.now()
  return {
    id: crypto.randomUUID(), detection: structuredClone(detection),
    classification: options.classification ?? classifyDetection(detection), style,
    replacement: replacementFor(detection, style), decision: 'pending', reviewer: null,
    reviewedAt: null, snapshotId: options.snapshotId ?? null, comments: [], createdAt,
    audit: [{ id: crypto.randomUUID(), action: 'created', actor: options.actor, createdAt, detail: 'Added to redaction review.' }],
  }
}

export function updateRedactionStyle(record: RedactionRecord, style: RedactionStyle): RedactionRecord {
  return { ...record, style, replacement: replacementFor(record.detection, style) }
}

export function summarizeRedactions(records: RedactionRecord[]): RedactionSummary {
  return records.reduce<RedactionSummary>((summary, record) => {
    summary.total += 1
    summary[record.decision] += 1
    summary.byClassification[record.classification] = (summary.byClassification[record.classification] ?? 0) + 1
    return summary
  }, { total: 0, pending: 0, approved: 0, rejected: 0, restored: 0, byClassification: {} })
}

export function activeRedactions(records: RedactionRecord[]): RedactionRecord[] {
  return records.filter((record) => record.decision === 'approved')
}
