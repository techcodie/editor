import type { PageLayout } from '../layout/types/layout'
import type { PaginationSnapshot } from '../layout/types/page'
import type {
  FormField,
  FormFieldDocumentEntry,
  FormFieldPatch,
} from '../forms/types/field'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6
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

export interface EditorDictationUpdate {
  text: string
  isFinal: boolean
  target: EditorInsertionTarget
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

export interface EditorDocumentMark {
  type: string
  attrs?: Record<string, unknown>
}

export interface EditorDocumentNode {
  type: string
  attrs?: Record<string, unknown>
  marks?: EditorDocumentMark[]
  text?: string
  content?: EditorDocumentNode[]
}

export type EditorDocumentChangeOrigin = 'local' | 'remote'

export interface EditorDocumentChange {
  origin: EditorDocumentChangeOrigin
  docChanged: boolean
  selectionChanged: boolean
}

export interface ReplaceDocumentSnapshotOptions {
  origin?: EditorDocumentChangeOrigin
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
  setHighlightColor(color: string | null): void
  getHighlightColor(): string | null
  toggleSuperscript(): void
  isSuperscript(): boolean
  toggleSubscript(): void
  isSubscript(): boolean

  setColor(color: string): void
  unsetColor(): void
  getColor(): string | null
  setFontFamily(family: string): void
  unsetFontFamily(): void
  getFontFamily(): string | null
  setFontSize(size: string): void
  unsetFontSize(): void
  getFontSize(): string | null

  isLink(): boolean
  getLinkHref(): string | null
  setLink(href: string): boolean
  unsetLink(): boolean

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

  isTable(): boolean
  addColumnBefore(): void
  addColumnAfter(): void
  deleteColumn(): void
  addRowBefore(): void
  addRowAfter(): void
  deleteRow(): void
  deleteTable(): void
  mergeOrSplitCell(): void
  toggleHeaderRow(): void
  toggleHeaderColumn(): void

  getDocumentText(): string
  getDocumentSnapshot(): EditorDocumentNode
  replaceDocumentSnapshot(
    snapshot: EditorDocumentNode,
    options?: ReplaceDocumentSnapshotOptions,
  ): boolean
  insertStructuredContent(insertion: EditorStructuredInsertion): boolean
  /**
   * Live speech-to-text streaming: replaces a tracked in-progress dictation
   * range with `text` on every call. The first call after the previous
   * utterance closed (or on first use) establishes the range at `target`;
   * later calls for the same utterance keep replacing that same range as
   * recognition revises its guess. `isFinal: true` commits the text and
   * closes the range so the next call starts a fresh utterance. Pass
   * `text: ''` with `isFinal: true` to discard an in-progress preview
   * without inserting anything (e.g. when the utterance turned out to be a
   * voice command instead of literal text). Every call is a normal,
   * undoable transaction — ProseMirror's own history grouping (not a
   * custom addToHistory suppression scheme) is what keeps a whole rapid
   * utterance to one undo step, the same way fast typing does.
   */
  updateDictation(update: EditorDictationUpdate): boolean
  insertAsset(asset: EditorAssetInsertion, target?: EditorInsertionTarget): boolean
  insertTable(rows?: number, columns?: number): boolean
  insertParagraph(): boolean
  replaceTextOccurrences(search: string, replacement: string): number

  insertFormField(field: FormField): boolean
  updateFormField(fieldId: string, patch: FormFieldPatch): boolean
  removeFormField(fieldId: string): boolean
  getFormFields(): FormFieldDocumentEntry[]
  getSelectedFormField(): FormFieldDocumentEntry | null
  focusFormField(fieldId: string): boolean

  addCommentAnchor(selection: EditorTextSelection, commentId: string): boolean
  removeCommentAnchor(commentId: string): boolean
  focusCommentAnchor(commentId: string): boolean
  getActiveCommentId(): string | null
  setReviewMode(enabled: boolean): void
  subscribeCommentInteractions(
    listener: (interaction: EditorCommentInteraction) => void,
  ): () => void

  setSuggestionMode(enabled: boolean): void
  insertTrackedSuggestion(content: string): boolean
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
  getSelectionRange(): { from: number; to: number } | null
  getRangeBounds(from: number, to: number): EditorSelectionBounds | null
  findTextSelection(text: string): EditorTextSelection | null
  focusTextSelection(selection: EditorTextSelection): boolean
  replaceTextSelection(selection: EditorTextSelection, replacement: string): boolean
  clearTextSelection(): void
  focus(): void

  subscribe(listener: () => void): () => void
  subscribeDocumentChanges(
    listener: (change: EditorDocumentChange) => void,
  ): () => void
  getSnapshot(): unknown
}
