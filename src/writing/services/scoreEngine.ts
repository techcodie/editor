import type { WritingSuggestion } from '../types/suggestion'
import type {
  ReadabilityMetrics,
  WritingScoreBreakdown,
  WritingStyleMetrics,
} from '../types/writing'
import { clampScore } from './textUtils'

const SEVERITY_WEIGHT = { info: 1.5, warning: 4, error: 7 } as const

export function calculateWritingScore(
  suggestions: WritingSuggestion[],
  style: WritingStyleMetrics,
  readability: ReadabilityMetrics,
  wordCount: number,
): { score: number; breakdown: WritingScoreBreakdown } {
  const density = Math.max(1, wordCount / 100)
  const correctnessPenalty = suggestions
    .filter((item) => ['grammar', 'spelling', 'punctuation', 'capitalization', 'formatting'].includes(item.category))
    .reduce((total, item) => total + SEVERITY_WEIGHT[item.severity], 0) / density
  const correctness = clampScore(100 - correctnessPenalty)
  const clarity = clampScore((style.clarity + style.conciseness + readability.score) / 3)
  const engagement = clampScore((style.sentenceVariety + style.vocabularyDiversity) / 2)
  const delivery = clampScore((style.professionalTone + style.consistency) / 2)
  return {
    score: clampScore(correctness * 0.4 + clarity * 0.3 + engagement * 0.15 + delivery * 0.15),
    breakdown: { correctness, clarity, engagement, delivery },
  }
}
