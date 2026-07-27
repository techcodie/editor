import { useCallback, useMemo, useState } from 'react'
import type { CommentAuthor } from '../../review/types/comment'
import type { TrackChangeDecision } from '../../review/trackChanges/types/trackChange'
import type {
  ComparisonDocument,
  ComparisonFilter,
  ComparisonSort,
  DocumentComparison,
} from '../types/comparison'
import { compareDocuments } from '../services/comparisonEngine'
import {
  decideAllComparisonChanges,
  decideComparisonChange,
  filterComparisonChanges,
} from '../services/comparisonRegistry'

const COMPARISON_AUTHOR: CommentAuthor = {
  id: 'comparison-engine',
  name: 'Comparison Engine',
}

export function useComparison(initialDocument: string) {
  const [leftDocument, setLeftDocument] = useState<ComparisonDocument>({
    id: 'left-document',
    name: 'Current document',
    kind: 'document',
    content: initialDocument,
  })
  const [rightDocument, setRightDocument] = useState<ComparisonDocument>({
    id: 'right-document',
    name: 'Modified document',
    kind: 'document',
    content: '',
  })
  const [comparison, setComparison] = useState<DocumentComparison | null>(null)
  const [filter, setFilter] = useState<ComparisonFilter>('all')
  const [sort, setSort] = useState<ComparisonSort>('document')
  const [query, setQuery] = useState('')
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null)

  const runComparison = useCallback(() => {
    const result = compareDocuments(leftDocument, rightDocument, COMPARISON_AUTHOR)
    setComparison(result)
    setSelectedChangeId(result.changes[0]?.id ?? null)
    setFilter('all')
    setQuery('')
  }, [leftDocument, rightDocument])

  const resetComparison = useCallback(() => {
    setComparison(null)
    setSelectedChangeId(null)
  }, [])

  const decide = useCallback((changeId: string, decision: TrackChangeDecision) => {
    setComparison((current) => current ? {
      ...current,
      changes: decideComparisonChange(current.changes, changeId, decision),
    } : current)
    return true
  }, [])

  const decideAll = useCallback((decision: TrackChangeDecision) => {
    setComparison((current) => current ? {
      ...current,
      changes: decideAllComparisonChanges(current.changes, decision),
    } : current)
  }, [])

  const visibleChanges = useMemo(
    () => filterComparisonChanges(comparison?.changes ?? [], filter, query, sort),
    [comparison?.changes, filter, query, sort],
  )

  return {
    leftDocument,
    rightDocument,
    comparison,
    filter,
    sort,
    query,
    selectedChangeId,
    visibleChanges,
    setLeftDocument,
    setRightDocument,
    runComparison,
    resetComparison,
    decide,
    decideAll,
    setFilter,
    setSort,
    setQuery,
    setSelectedChangeId,
  }
}
