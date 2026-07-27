import type { TrackChange } from '../../review/trackChanges/types/trackChange'
import type { DiffSegment } from './diff'

export type ComparisonSourceKind = 'document' | 'version'
export type ComparisonViewMode = 'split' | 'unified'
export type ComparisonSort = 'document' | 'type'
export type ComparisonFilter =
  | 'all'
  | 'insert'
  | 'delete'
  | 'replace'
  | 'format'
  | 'pending'
  | 'accepted'
  | 'rejected'

export interface ComparisonDocument {
  id: string
  name: string
  kind: ComparisonSourceKind
  content: string
}

export interface ComparisonStatistics {
  totalChanges: number
  insertions: number
  deletions: number
  replacements: number
  formatting: number
  wordCountDifference: number
  characterDifference: number
  estimatedReadingDifference: number
}

export interface ComparisonSummaryData {
  title: string
  description: string
}

export interface DocumentComparison {
  id: string
  leftDocument: ComparisonDocument
  rightDocument: ComparisonDocument
  summary: ComparisonSummaryData
  changes: TrackChange[]
  statistics: ComparisonStatistics
  segments: DiffSegment[]
  createdAt: number
}
