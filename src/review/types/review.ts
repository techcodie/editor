import type { EditorSelectionBounds, EditorTextSelection } from '../../lib/editor-api'

export type ReviewFilter = 'active' | 'resolved' | 'mine' | 'all'
export type ReviewSort = 'newest' | 'oldest'

export interface PendingComment {
  selection: EditorTextSelection
}

export interface CommentHighlightPreviewState {
  commentId: string
  bounds: EditorSelectionBounds
}
