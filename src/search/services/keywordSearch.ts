import { tokenizeSearchText } from './embeddingEngine'
import type { IndexedDocument } from '../types/search'

export interface KeywordMatch {
  score: number
  matchedTerms: string[]
}

export function keywordSearch(
  query: string,
  document: IndexedDocument,
  corpusSize: number,
  documentFrequency: ReadonlyMap<string, number>,
): KeywordMatch {
  const terms = [...new Set(tokenizeSearchText(query))]
  if (terms.length === 0) return { score: 0, matchedTerms: [] }
  const contentTokens = tokenizeSearchText(`${document.title} ${document.content}`)
  const counts = new Map<string, number>()
  for (const token of contentTokens) counts.set(token, (counts.get(token) ?? 0) + 1)
  let score = 0
  const matchedTerms: string[] = []
  for (const term of terms) {
    const count = counts.get(term) ?? 0
    if (count === 0) continue
    matchedTerms.push(term)
    const inverseFrequency = Math.log(1 + corpusSize / (1 + (documentFrequency.get(term) ?? 0)))
    const titleBoost = document.title.toLocaleLowerCase().includes(term) ? 1.5 : 1
    score += (1 + Math.log(count)) * inverseFrequency * titleBoost
  }
  return {
    score: Math.min(1, score / Math.max(1, terms.length * 3)),
    matchedTerms,
  }
}

export function buildDocumentFrequency(documents: IndexedDocument[]): Map<string, number> {
  const frequency = new Map<string, number>()
  for (const document of documents) {
    for (const token of new Set(tokenizeSearchText(`${document.title} ${document.content}`))) {
      frequency.set(token, (frequency.get(token) ?? 0) + 1)
    }
  }
  return frequency
}
