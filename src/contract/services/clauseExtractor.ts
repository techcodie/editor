import type { ContractClause } from '../types/clause'

interface TextLine {
  text: string
  start: number
  end: number
}

function linesWithOffsets(text: string): TextLine[] {
  const lines: TextLine[] = []
  let start = 0
  for (const value of text.split(/\n/)) {
    lines.push({ text: value.trim(), start, end: start + value.length })
    start += value.length + 1
  }
  return lines
}

function isHeading(value: string): boolean {
  if (!value || value.length > 110) return false
  if (/^#{1,6}\s+\S/.test(value)) return true
  if (/^(?:section\s+)?\d+(?:\.\d+)*[.)]?\s+[A-Z][^.!?]{1,80}$/i.test(value)) return true
  const letters = value.replace(/[^A-Za-z]/g, '')
  return letters.length >= 4 && value === value.toLocaleUpperCase() && !/[.!?]$/.test(value)
}

function cleanHeading(value: string): string {
  return value.replace(/^#{1,6}\s+/, '').replace(/^(?:section\s+)?\d+(?:\.\d+)*[.)]?\s+/i, '').trim()
}

export function extractClauses(text: string): ContractClause[] {
  const lines = linesWithOffsets(text)
  const headings = lines.map((line, index) => ({ line, index })).filter(({ line }) => isHeading(line.text))
  if (headings.length) {
    return headings.flatMap(({ line, index }, headingIndex) => {
      const nextLineIndex = headings[headingIndex + 1]?.index ?? lines.length
      const bodyLines = lines.slice(index + 1, nextLineIndex).filter((item) => item.text)
      const body = bodyLines.map((item) => item.text).join('\n').trim()
      if (!body) return []
      const end = bodyLines.at(-1)?.end ?? line.end
      return [{
        id: crypto.randomUUID(), title: cleanHeading(line.text), text: body,
        type: 'general' as const, confidence: 0, range: { start: line.start, end },
        order: headingIndex, source: /^\d|^section/i.test(line.text) ? 'numbered-section' as const : 'heading' as const,
      }]
    })
  }

  const paragraphs = text.split(/\n\s*\n/)
  let cursor = 0
  return paragraphs.flatMap((paragraph, order) => {
    const value = paragraph.trim()
    const start = text.indexOf(value, cursor)
    cursor = Math.max(cursor, start + value.length)
    if (!value || start < 0) return []
    return [{
      id: crypto.randomUUID(), title: `Clause ${order + 1}`, text: value,
      type: 'general' as const, confidence: 0.35, range: { start, end: start + value.length },
      order, source: 'paragraph' as const,
    }]
  })
}
