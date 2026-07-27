import type { CommentAuthor } from '../../review/types/comment'
import type {
  ComparisonDocument,
  ComparisonStatistics,
  DocumentComparison,
} from '../types/comparison'
import { createDocumentDiff } from './diffEngine'

const WORDS_PER_MINUTE = 200

function countWords(content: string): number {
  const normalized = content.trim()
  return normalized ? normalized.split(/\s+/).length : 0
}

function createStatistics(
  left: ComparisonDocument,
  right: ComparisonDocument,
  changes: DocumentComparison['changes'],
): ComparisonStatistics {
  const leftWords = countWords(left.content)
  const rightWords = countWords(right.content)
  return {
    totalChanges: changes.length,
    insertions: changes.filter((change) => change.type === 'insert').length,
    deletions: changes.filter((change) => change.type === 'delete').length,
    replacements: changes.filter((change) => change.type === 'replace').length,
    formatting: changes.filter((change) => change.type === 'format').length,
    wordCountDifference: rightWords - leftWords,
    characterDifference: right.content.length - left.content.length,
    estimatedReadingDifference:
      Math.round(((rightWords - leftWords) / WORDS_PER_MINUTE) * 10) / 10,
  }
}

export function compareDocuments(
  leftDocument: ComparisonDocument,
  rightDocument: ComparisonDocument,
  author: CommentAuthor,
): DocumentComparison {
  const id = crypto.randomUUID()
  const createdAt = Date.now()
  const { changes, segments } = createDocumentDiff(
    leftDocument.content,
    rightDocument.content,
    id,
    author,
    createdAt,
  )
  const statistics = createStatistics(leftDocument, rightDocument, changes)
  const description = changes.length === 0
    ? 'No differences were found between these documents.'
    : `${changes.length} change${changes.length === 1 ? '' : 's'} found from ${leftDocument.name} to ${rightDocument.name}.`

  return {
    id,
    leftDocument: { ...leftDocument },
    rightDocument: { ...rightDocument },
    summary: {
      title: changes.length === 0 ? 'Documents match' : 'Comparison complete',
      description,
    },
    changes,
    statistics,
    segments,
    createdAt,
  }
}
