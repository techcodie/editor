import { tokenizeSearchText } from './embeddingEngine'
import type {
  IndexedDocument,
  SearchIndexInput,
  SearchSection,
} from '../types/search'

const ENTITY_PATTERN = /\b(?:[A-Z][\p{L}\p{N}&.-]+(?:\s+|$)){1,4}/gu
const REFERENCE_PATTERN = /\b(?:section|article|clause|schedule|appendix)\s+[A-Z0-9][A-Z0-9.-]*|https?:\/\/[^\s)]+/giu

export function fingerprintSearchInput(input: SearchIndexInput): string {
  const value = `${input.id}\u0000${input.title}\u0000${input.content}\u0000${JSON.stringify(input.metadata)}`
  let hash = 2_166_136_261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }
  return `${value.length}-${(hash >>> 0).toString(16)}`
}

export function extractKeywords(value: string, limit = 18): string[] {
  const counts = new Map<string, number>()
  for (const token of tokenizeSearchText(value)) {
    counts.set(token, (counts.get(token) ?? 0) + 1)
  }
  return [...counts.entries()]
    .toSorted((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([token]) => token)
}

export function extractEntities(value: string, limit = 24): string[] {
  const entities = new Map<string, string>()
  for (const match of value.match(ENTITY_PATTERN) ?? []) {
    const entity = match.trim().replace(/[.,;:]+$/, '')
    if (entity.length < 3) continue
    entities.set(entity.toLocaleLowerCase(), entity)
  }
  return [...entities.values()].slice(0, limit)
}

export function extractReferences(value: string, limit = 24): string[] {
  return [...new Set((value.match(REFERENCE_PATTERN) ?? []).map((item) => item.trim()))]
    .slice(0, limit)
}

export function extractSections(content: string): SearchSection[] {
  const lines = content.split(/\r?\n/)
  const sections: SearchSection[] = []
  let offset = 0
  let title = 'Document'
  let level = 1
  let start = 0
  let body: string[] = []
  const flush = (end: number) => {
    const sectionContent = body.join('\n').trim()
    if (!sectionContent && sections.length > 0) return
    sections.push({
      id: `section-${sections.length + 1}`,
      title,
      content: sectionContent,
      start,
      end,
      level,
    })
  }
  for (const line of lines) {
    const heading = line.match(/^\s*(#{1,6})\s+(.+)$/) ?? line.match(/^\s*([A-Z][^.!?]{2,80})\s*$/)
    if (heading && body.some((item) => item.trim())) {
      flush(offset)
      title = heading[2]?.trim() ?? heading[1].trim()
      level = heading[2] ? heading[1].length : 2
      start = offset
      body = []
    } else if (heading && sections.length === 0 && body.length === 0) {
      title = heading[2]?.trim() ?? heading[1].trim()
      level = heading[2] ? heading[1].length : 1
      start = offset
    } else {
      body.push(line)
    }
    offset += line.length + 1
  }
  flush(content.length)
  return sections.length > 0 ? sections : [{
    id: 'section-1',
    title: 'Document',
    content,
    start: 0,
    end: content.length,
    level: 1,
  }]
}

export function linkSearchDocument(
  input: SearchIndexInput,
  embedding: number[],
  indexedAt = Date.now(),
): IndexedDocument {
  return {
    ...input,
    embedding,
    keywords: extractKeywords(`${input.title} ${input.content}`),
    entities: extractEntities(input.content),
    references: extractReferences(input.content),
    sections: extractSections(input.content),
    lastIndexed: indexedAt,
    fingerprint: fingerprintSearchInput(input),
  }
}
