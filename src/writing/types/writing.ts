import type { VocabularySuggestion, WritingSuggestion } from './suggestion'
import type { WritingRewriteAction } from '../../../shared/writing'

export type { WritingRewriteAction } from '../../../shared/writing'

export type WritingTone =
  | 'professional'
  | 'formal'
  | 'friendly'
  | 'confident'
  | 'neutral'

export type ReadabilityLevel =
  | 'very-easy'
  | 'easy'
  | 'standard'
  | 'difficult'
  | 'very-difficult'

export type SentenceComplexity = 'low' | 'moderate' | 'high'
export type ParagraphComplexity = 'low' | 'moderate' | 'high'

export interface WritingStyleMetrics {
  clarity: number
  conciseness: number
  professionalTone: number
  consistency: number
  sentenceVariety: number
  vocabularyDiversity: number
}

export interface ReadabilityMetrics {
  score: number
  level: ReadabilityLevel
  estimatedReadingMinutes: number
  sentenceComplexity: SentenceComplexity
  paragraphComplexity: ParagraphComplexity
  averageSentenceWords: number
  averageParagraphWords: number
}

export interface ToneAnalysis {
  primary: WritingTone
  confidence: number
  signals: string[]
}

export interface WritingScoreBreakdown {
  correctness: number
  clarity: number
  engagement: number
  delivery: number
}

export interface WritingAnalysis {
  id: string
  analyzedAt: number
  documentHash: string
  wordCount: number
  sentenceCount: number
  paragraphCount: number
  score: number
  scoreBreakdown: WritingScoreBreakdown
  style: WritingStyleMetrics
  readability: ReadabilityMetrics
  tone: ToneAnalysis
  suggestions: WritingSuggestion[]
  vocabulary: VocabularySuggestion[]
}

export type WritingAnalysisStage =
  | 'idle'
  | 'grammar'
  | 'style'
  | 'readability'
  | 'suggestions'
  | 'complete'

export interface WritingAnalysisProgress {
  stage: WritingAnalysisStage
  progress: number
  message: string
}

export type WritingRewriteScope = 'selection' | 'document'

export interface WritingRewriteResult {
  id: string
  action: WritingRewriteAction
  scope: WritingRewriteScope
  originalText: string
  rewrittenText: string
  createdAt: number
  assistedByAi: boolean
}

export interface WritingAnalysisSnapshot {
  id: string
  createdAt: number
  documentHash: string
  score: number
  suggestionCount: number
  tone: WritingTone
  readabilityScore: number
}
