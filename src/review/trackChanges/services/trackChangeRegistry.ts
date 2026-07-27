import type { EditorTrackChangeDraft } from '../../../lib/editor-api'
import type {
  TrackChange,
  TrackChangeDecision,
  TrackChangeStatus,
} from '../types/trackChange'
import type { CommentAuthor } from '../../types/comment'

export function createTrackChange(
  draft: EditorTrackChangeDraft,
  author: CommentAuthor,
): TrackChange {
  return {
    ...draft,
    author,
    createdAt: draft.createdAt,
    updatedAt: draft.createdAt,
    status: 'pending',
    accepted: false,
    rejected: false,
  }
}

export function mergeTrackChange(
  change: TrackChange,
  draft: EditorTrackChangeDraft,
): TrackChange {
  const isGroupedInsertion = change.type === 'insert' && draft.type === 'insert'
  const isGroupedDeletion = change.type === 'delete' && draft.type === 'delete'
  const groupedBefore = isGroupedDeletion
    ? draft.range.from < change.range.from
      ? `${draft.before}${change.before}`
      : `${change.before}${draft.before}`
    : draft.before
  const groupedAfter = isGroupedInsertion
    ? draft.range.from < change.range.from
      ? `${draft.after}${change.after}`
      : `${change.after}${draft.after}`
    : draft.after
  return {
    ...change,
    range: draft.range,
    before: groupedBefore,
    after: groupedAfter,
    updatedAt: draft.createdAt,
  }
}

export function decideTrackChange(
  change: TrackChange,
  decision: TrackChangeDecision,
): TrackChange {
  const status: TrackChangeStatus = decision === 'accept' ? 'accepted' : 'rejected'
  return {
    ...change,
    status,
    accepted: status === 'accepted',
    rejected: status === 'rejected',
    updatedAt: Date.now(),
  }
}
