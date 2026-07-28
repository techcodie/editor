import type { VocabularySuggestion, WritingSuggestion } from '../types/suggestion'
import { documentHash, words } from './textUtils'

const ALTERNATIVES: Record<string, string[]> = {
  important: ['essential', 'significant', 'notable'],
  good: ['effective', 'strong', 'valuable'],
  bad: ['weak', 'harmful', 'unsuitable'],
  make: ['create', 'produce', 'develop'],
  very: ['highly', 'especially', 'particularly'],
  thing: ['element', 'factor', 'item'],
  use: ['apply', 'adopt', 'employ'],
}

export function mergeSuggestions(...groups: WritingSuggestion[][]): WritingSuggestion[] {
  const seen = new Set<string>()
  return groups.flat().filter((suggestion) => {
    const key = `${suggestion.range.from}:${suggestion.range.to}:${suggestion.category}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).toSorted((left, right) => left.range.from - right.range.from || right.confidence - left.confidence)
}

export function createVocabularySuggestions(text: string): VocabularySuggestion[] {
  const counts = new Map<string, { count: number; from: number }>()
  const pattern = /[A-Za-z]+/g
  for (const match of text.matchAll(pattern)) {
    const word = match[0].toLocaleLowerCase()
    if (!ALTERNATIVES[word]) continue
    const current = counts.get(word)
    counts.set(word, { count: (current?.count ?? 0) + 1, from: current?.from ?? (match.index ?? 0) })
  }
  return [...counts.entries()]
    .filter(([, value]) => value.count >= 2)
    .map(([word, value]) => ({
      id: `vocabulary-${word}-${documentHash(word)}`,
      word,
      alternatives: ALTERNATIVES[word],
      count: value.count,
      reason: `“${word}” appears ${value.count} times. Varying it may improve flow.`,
      range: { from: value.from, to: value.from + word.length },
    }))
    .toSorted((left, right) => right.count - left.count)
    .slice(0, 8)
}

export function vocabularyDiversity(text: string): number {
  const tokens = words(text).map((word) => word.toLocaleLowerCase())
  return tokens.length ? new Set(tokens).size / tokens.length : 1
}
