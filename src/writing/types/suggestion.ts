export type WritingSuggestionCategory =
  | 'grammar'
  | 'spelling'
  | 'repetition'
  | 'passive-voice'
  | 'long-sentence'
  | 'wordiness'
  | 'tense'
  | 'punctuation'
  | 'capitalization'
  | 'formatting'
  | 'vocabulary'

export type WritingSuggestionSeverity = 'info' | 'warning' | 'error'
export type WritingSuggestionStatus = 'open' | 'dismissed'

export interface WritingTextRange {
  from: number
  to: number
}

export interface WritingSuggestion {
  id: string
  title: string
  originalText: string
  suggestedText: string
  reason: string
  severity: WritingSuggestionSeverity
  confidence: number
  category: WritingSuggestionCategory
  range: WritingTextRange
  status: WritingSuggestionStatus
}

export interface VocabularySuggestion {
  id: string
  word: string
  alternatives: string[]
  count: number
  reason: string
  range: WritingTextRange
}
