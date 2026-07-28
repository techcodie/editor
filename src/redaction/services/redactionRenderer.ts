import type { RedactionRecord } from '../types/redaction'

export interface RedactionPreviewSegment {
  text: string
  redacted: boolean
  recordId?: string
}

export function renderRedactionPreview(text: string, records: RedactionRecord[]): RedactionPreviewSegment[] {
  const active = records
    .filter((record) => record.decision === 'approved')
    .toSorted((left, right) => left.detection.range.from - right.detection.range.from)
  const segments: RedactionPreviewSegment[] = []
  let cursor = 0
  for (const record of active) {
    const { from, to } = record.detection.range
    if (from < cursor || from >= text.length || to <= from) continue
    if (from > cursor) segments.push({ text: text.slice(cursor, from), redacted: false })
    segments.push({ text: record.replacement, redacted: true, recordId: record.id })
    cursor = Math.min(text.length, to)
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), redacted: false })
  return segments
}
