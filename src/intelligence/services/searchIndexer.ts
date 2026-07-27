import type { DocumentSearchIndex } from '../types/documentModel'
import type { LayoutBlock } from '../types/layout'

const TOKEN_PATTERN = /[\p{L}\p{N}][\p{L}\p{N}'-]*/gu

export function buildSearchIndex(blocks: LayoutBlock[]): DocumentSearchIndex {
  const byTerm = new Map<string, { occurrences: number; blockIds: Set<string> }>()
  const searchableText = blocks.map((block) => block.text).filter(Boolean).join('\n')

  for (const block of blocks) {
    for (const token of block.text.toLocaleLowerCase().match(TOKEN_PATTERN) ?? []) {
      const current = byTerm.get(token) ?? { occurrences: 0, blockIds: new Set<string>() }
      current.occurrences += 1
      current.blockIds.add(block.id)
      byTerm.set(token, current)
    }
  }

  return {
    entries: [...byTerm.entries()]
      .map(([term, value]) => ({
        term,
        occurrences: value.occurrences,
        blockIds: [...value.blockIds],
      }))
      .sort((left, right) => right.occurrences - left.occurrences || left.term.localeCompare(right.term)),
    searchableText,
    indexedAt: new Date().toISOString(),
  }
}
