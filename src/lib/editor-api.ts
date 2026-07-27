import type { PageLayout } from '../layout/types/layout'
import type { PaginationSnapshot } from '../layout/types/page'

export type HeadingLevel = 1 | 2 | 3
export type TextAlignment = 'left' | 'center' | 'right' | 'justify'

export interface EditorSelectionBounds {
  top: number
  right: number
  bottom: number
  left: number
}

export interface EditorTextSelection {
  from: number
  to: number
  text: string
  bounds: EditorSelectionBounds
}

export type EditorInsertionTarget = 'cursor' | 'selection' | 'end'

export interface EditorInsertionProvenance {
  responseId: string
  sourceIds: string[]
  timestamp: number
}

export interface EditorStructuredInsertion {
  target: EditorInsertionTarget
  content: string
  provenance: EditorInsertionProvenance
  selection?: EditorTextSelection
}

export interface EditorAssetInsertion {
  assetId: string
  type: string
  category: string
  title: string
  renderer: string
  renderData: Record<string, unknown>
  width: number
  height: number
  rotation: number
}

export type EditorCommentInteractionType = 'open' | 'preview' | 'leave'

export interface EditorCommentInteraction {
  type: EditorCommentInteractionType
  commentId: string
  bounds: EditorSelectionBounds
}

export type EditorTrackChangeType = 'insert' | 'delete' | 'replace' | 'format'
export type EditorTrackChangeDecision = 'accept' | 'reject'

export interface EditorTrackChangeDraft {
  id: string
  type: EditorTrackChangeType
  createdAt: number
  range: { from: number; to: number }
  before: string
  after: string
}

export interface EditorTrackChangeInteraction {
  type: EditorCommentInteractionType
  changeId: string
  bounds: EditorSelectionBounds
}

/**
 * Framework-neutral editor command surface used by SDK UI and host applications.
 */
export interface EditorApi {
  undo(): void
  redo(): void
  canUndo(): boolean
  canRedo(): boolean

  setParagraph(): void
  isParagraph(): boolean
  toggleHeading(level: HeadingLevel): void
  isHeading(level: HeadingLevel): boolean

  toggleBold(): void
  isBold(): boolean
  toggleItalic(): void
  isItalic(): boolean
  toggleUnderline(): void
  isUnderline(): boolean
  toggleStrike(): void
  isStrike(): boolean
  toggleInlineCode(): void
  isInlineCode(): boolean
  toggleHighlight(): void
  isHighlight(): boolean

  toggleBulletList(): void
  isBulletList(): boolean
  toggleOrderedList(): void
  isOrderedList(): boolean
  toggleTaskList(): void
  isTaskList(): boolean

  setTextAlign(align: TextAlignment): void
  isTextAlign(align: TextAlignment): boolean

  toggleBlockquote(): void
  isBlockquote(): boolean
  toggleCodeBlock(): void
  isCodeBlock(): boolean
  insertHorizontalRule(): void
  clearFormatting(): void

  getDocumentText(): string
  insertStructuredContent(insertion: EditorStructuredInsertion): boolean
  insertAsset(asset: EditorAssetInsertion): boolean

  addCommentAnchor(selection: EditorTextSelection, commentId: string): boolean
  removeCommentAnchor(commentId: string): boolean
  focusCommentAnchor(commentId: string): boolean
  getActiveCommentId(): string | null
  setReviewMode(enabled: boolean): void
  subscribeCommentInteractions(
    listener: (interaction: EditorCommentInteraction) => void,
  ): () => void

  setSuggestionMode(enabled: boolean): void
  subscribeTrackChanges(
    listener: (change: EditorTrackChangeDraft) => void,
  ): () => void
  resolveTrackChange(
    changeId: string,
    decision: EditorTrackChangeDecision,
  ): boolean
  focusTrackChange(
    changeId: string,
    fallbackRange?: { from: number; to: number },
  ): boolean
  subscribeTrackChangeInteractions(
    listener: (interaction: EditorTrackChangeInteraction) => void,
  ): () => void

  setPageLayout(layout: PageLayout | null): void
  getPaginationSnapshot(): PaginationSnapshot
  subscribePagination(listener: (snapshot: PaginationSnapshot) => void): () => void
  insertPageBreak(): boolean
  removePageBreak(pageBreakId: string): boolean
  setPrintPreviewMode(enabled: boolean): void

  getTextSelection(): EditorTextSelection | null
  replaceTextSelection(selection: EditorTextSelection, replacement: string): boolean
  clearTextSelection(): void
  focus(): void

  subscribe(listener: () => void): () => void
  getSnapshot(): unknown
}
