import { decideTrackChange } from '../../review/trackChanges/services/trackChangeRegistry'
import { matchesTrackChangeSearch } from '../../review/trackChanges/services/trackChangeRenderer'
import type {
  TrackChange,
  TrackChangeDecision,
} from '../../review/trackChanges/types/trackChange'
import type { ComparisonFilter, ComparisonSort } from '../types/comparison'

export function decideComparisonChange(
  changes: TrackChange[],
  changeId: string,
  decision: TrackChangeDecision,
): TrackChange[] {
  return changes.map((change) =>
    change.id === changeId ? decideTrackChange(change, decision) : change,
  )
}

export function decideAllComparisonChanges(
  changes: TrackChange[],
  decision: TrackChangeDecision,
): TrackChange[] {
  return changes.map((change) =>
    change.status === 'pending' ? decideTrackChange(change, decision) : change,
  )
}

export function filterComparisonChanges(
  changes: TrackChange[],
  filter: ComparisonFilter,
  query: string,
  sort: ComparisonSort,
): TrackChange[] {
  return changes
    .filter((change) => {
      const matchesFilter = filter === 'all'
        ? true
        : filter === 'pending' || filter === 'accepted' || filter === 'rejected'
          ? change.status === filter
          : change.type === filter
      return matchesFilter && matchesTrackChangeSearch(change, query)
    })
    .sort((left, right) =>
      sort === 'document'
        ? left.range.from - right.range.from
        : left.type.localeCompare(right.type) || left.range.from - right.range.from,
    )
}
