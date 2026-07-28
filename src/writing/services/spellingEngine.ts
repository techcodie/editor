import type { WritingSuggestion } from '../types/suggestion'
import { createSuggestion } from './textUtils'

const COMMON_MISSPELLINGS: Record<string, string> = {
  accomodate: 'accommodate',
  acheive: 'achieve',
  adress: 'address',
  definately: 'definitely',
  enviroment: 'environment',
  goverment: 'government',
  occured: 'occurred',
  recieve: 'receive',
  seperate: 'separate',
  teh: 'the',
  theirfore: 'therefore',
  untill: 'until',
  wich: 'which',
}

function preserveCase(original: string, replacement: string): string {
  if (original === original.toUpperCase()) return replacement.toUpperCase()
  if (original[0] === original[0]?.toUpperCase()) {
    return `${replacement[0]?.toUpperCase()}${replacement.slice(1)}`
  }
  return replacement
}

export function detectSpellingIssues(text: string): WritingSuggestion[] {
  const suggestions: WritingSuggestion[] = []
  const pattern = /[A-Za-z]+/g
  for (const match of text.matchAll(pattern)) {
    const original = match[0]
    const corrected = COMMON_MISSPELLINGS[original.toLocaleLowerCase()]
    if (!corrected) continue
    const from = match.index ?? 0
    suggestions.push(createSuggestion({
      category: 'spelling',
      title: 'Possible spelling error',
      originalText: original,
      suggestedText: preserveCase(original, corrected),
      reason: `“${original}” may be misspelled.`,
      severity: 'error',
      confidence: 0.98,
      range: { from, to: from + original.length },
    }))
  }
  return suggestions
}
