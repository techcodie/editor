import type {
  WritingSuggestion,
  WritingSuggestionCategory,
  WritingSuggestionSeverity,
  WritingTextRange,
} from '../types/suggestion'

export interface TextSegment {
  text: string
  from: number
  to: number
}

export function clampScore(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)))
}

export function documentHash(text: string): string {
  let hash = 2_166_136_261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }
  return `${text.length}-${(hash >>> 0).toString(16)}`
}

export function words(text: string): string[] {
  return text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) ?? []
}

export function sentences(text: string): TextSegment[] {
  const result: TextSegment[] = []
  const pattern = /[^.!?\n]+(?:[.!?]+|(?=\n|$))/g
  for (const match of text.matchAll(pattern)) {
    const raw = match[0]
    const leftTrim = raw.length - raw.trimStart().length
    const value = raw.trim()
    if (!value) continue
    const from = (match.index ?? 0) + leftTrim
    result.push({ text: value, from, to: from + value.length })
  }
  return result
}

export function paragraphs(text: string): TextSegment[] {
  const result: TextSegment[] = []
  const pattern = /[^\n]+(?:\n|$)/g
  for (const match of text.matchAll(pattern)) {
    const raw = match[0].replace(/\n$/, '')
    const leftTrim = raw.length - raw.trimStart().length
    const value = raw.trim()
    if (!value) continue
    const from = (match.index ?? 0) + leftTrim
    result.push({ text: value, from, to: from + value.length })
  }
  return result
}

function suggestionId(category: WritingSuggestionCategory, range: WritingTextRange, original: string) {
  return `writing-${category}-${range.from}-${range.to}-${documentHash(original)}`
}

export function createSuggestion(input: {
  category: WritingSuggestionCategory
  title: string
  originalText: string
  suggestedText: string
  reason: string
  severity: WritingSuggestionSeverity
  confidence: number
  range: WritingTextRange
}): WritingSuggestion {
  return {
    ...input,
    id: suggestionId(input.category, input.range, input.originalText),
    confidence: Math.max(0, Math.min(1, input.confidence)),
    status: 'open',
  }
}

export function replaceFirstInsensitive(text: string, original: string, replacement: string): string {
  const index = text.toLocaleLowerCase().indexOf(original.toLocaleLowerCase())
  if (index < 0) return text
  return `${text.slice(0, index)}${replacement}${text.slice(index + original.length)}`
}
