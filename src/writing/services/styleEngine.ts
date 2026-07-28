import type { WritingStyleMetrics } from '../types/writing'
import type { WritingSuggestion } from '../types/suggestion'
import { clampScore, sentences, words } from './textUtils'

const INFORMAL_WORDS = new Set(['awesome', 'basically', 'cool', 'gonna', 'kinda', 'stuff', 'things'])

export function analyzeStyle(text: string, suggestions: WritingSuggestion[]): WritingStyleMetrics {
  const allWords = words(text).map((word) => word.toLocaleLowerCase())
  const sentenceLengths = sentences(text).map((sentence) => words(sentence.text).length)
  const uniqueWords = new Set(allWords)
  const informalCount = allWords.filter((word) => INFORMAL_WORDS.has(word)).length
  const longCount = suggestions.filter((item) => item.category === 'long-sentence').length
  const wordyCount = suggestions.filter((item) => item.category === 'wordiness').length
  const repeatedCount = suggestions.filter((item) => item.category === 'repetition').length
  const average = sentenceLengths.length
    ? sentenceLengths.reduce((total, value) => total + value, 0) / sentenceLengths.length
    : 0
  const variance = sentenceLengths.length
    ? sentenceLengths.reduce((total, value) => total + (value - average) ** 2, 0) / sentenceLengths.length
    : 0
  const diversity = allWords.length ? uniqueWords.size / allWords.length : 1

  return {
    clarity: clampScore(96 - longCount * 8 - wordyCount * 5),
    conciseness: clampScore(98 - wordyCount * 9 - repeatedCount * 6 - Math.max(0, average - 22)),
    professionalTone: clampScore(96 - informalCount * 6),
    consistency: clampScore(98 - suggestions.filter((item) => item.category === 'tense' || item.category === 'formatting').length * 10),
    sentenceVariety: clampScore(sentenceLengths.length < 2 ? 70 : 62 + Math.min(30, Math.sqrt(variance) * 4)),
    vocabularyDiversity: clampScore(45 + diversity * 55),
  }
}
