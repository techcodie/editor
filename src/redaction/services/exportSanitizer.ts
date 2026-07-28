import type { RenderedBlock, RenderedDocument, RenderedText } from '../../export/types/export'
import type { RedactionRecord } from '../types/redaction'

function exportRecords(records: RedactionRecord[]): RedactionRecord[] {
  return records.filter((record) => record.decision === 'approved')
}

export function sanitizeTextForExport(text: string, records: RedactionRecord[]): string {
  const active = exportRecords(records).toSorted((left, right) => right.detection.range.from - left.detection.range.from)
  return active.reduce((value, record) => {
    const { from, to } = record.detection.range
    if (from < 0 || to > value.length || to <= from) return value
    return `${value.slice(0, from)}${record.replacement}${value.slice(to)}`
  }, text)
}

export function excludeRedactedText(text: string, records: RedactionRecord[]): string {
  const hidden = exportRecords(records).map((record) => ({ ...record, replacement: ' '.repeat(record.detection.value.length) }))
  return sanitizeTextForExport(text, hidden)
}

function replaceOccurrences(text: string, records: RedactionRecord[]): string {
  let value = text
  for (const record of exportRecords(records)) {
    if (!record.detection.value || !value.includes(record.detection.value)) continue
    value = value.replace(record.detection.value, record.replacement)
  }
  return value
}

function sanitizeRuns(runs: RenderedText[], records: RedactionRecord[]): RenderedText[] {
  return runs.map((run) => ({ ...run, text: replaceOccurrences(run.text, records) }))
}

function sanitizeBlock(block: RenderedBlock, records: RedactionRecord[]): RenderedBlock {
  const runs = sanitizeRuns(block.runs, records)
  return {
    ...block, runs, text: runs.map((run) => run.text).join(''),
    rows: block.rows?.map((row) => row.map((cell) => ({
      blocks: cell.blocks.map((nested) => sanitizeBlock(nested, records)),
    }))),
  }
}

export function sanitizeRenderedDocument(
  document: RenderedDocument,
  records: RedactionRecord[],
): RenderedDocument {
  if (!exportRecords(records).length) return document
  const blocks = document.blocks.map((block) => sanitizeBlock(block, records))
  const byId = new Map(blocks.map((block) => [block.id, block]))
  return {
    ...document,
    blocks,
    pages: document.pages.map((page) => ({
      ...page,
      blocks: page.blocks.map((block) => byId.get(block.id) ?? sanitizeBlock(block, records)),
    })),
  }
}
