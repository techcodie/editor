import type { ReadabilityLevel, ReadabilityMetrics } from '../types/writing'
import { clampScore, paragraphs, sentences, words } from './textUtils'

function syllables(word: string): number {
  const normalized = word.toLocaleLowerCase().replace(/[^a-z]/g, '')
  if (normalized.length <= 3) return normalized ? 1 : 0
  const groups = normalized.replace(/(?:e|es|ed)$/, '').match(/[aeiouy]+/g)
  return Math.max(1, groups?.length ?? 1)
}

function level(score: number): ReadabilityLevel {
  if (score >= 80) return 'very-easy'
  if (score >= 65) return 'easy'
  if (score >= 50) return 'standard'
  if (score >= 30) return 'difficult'
  return 'very-difficult'
}

function complexity(value: number, moderate: number, high: number): 'low' | 'moderate' | 'high' {
  return value >= high ? 'high' : value >= moderate ? 'moderate' : 'low'
}

export function analyzeReadability(text: string): ReadabilityMetrics {
  const allWords = words(text)
  const allSentences = sentences(text)
  const allParagraphs = paragraphs(text)
  const wordCount = allWords.length
  const sentenceCount = Math.max(1, allSentences.length)
  const paragraphCount = Math.max(1, allParagraphs.length)
  const averageSentenceWords = wordCount / sentenceCount
  const averageParagraphWords = wordCount / paragraphCount
  const syllableCount = allWords.reduce((total, word) => total + syllables(word), 0)
  const raw = wordCount
    ? 206.835 - 1.015 * averageSentenceWords - 84.6 * (syllableCount / wordCount)
    : 100
  const score = clampScore(raw)
  return {
    score,
    level: level(score),
    estimatedReadingMinutes: wordCount === 0 ? 0 : Math.max(1, Math.ceil(wordCount / 220)),
    sentenceComplexity: complexity(averageSentenceWords, 18, 28),
    paragraphComplexity: complexity(averageParagraphWords, 75, 140),
    averageSentenceWords: Math.round(averageSentenceWords * 10) / 10,
    averageParagraphWords: Math.round(averageParagraphWords * 10) / 10,
  }
}
