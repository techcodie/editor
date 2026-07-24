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

  getTextSelection(): EditorTextSelection | null
  replaceTextSelection(selection: EditorTextSelection, replacement: string): boolean
  clearTextSelection(): void
  focus(): void

  subscribe(listener: () => void): () => void
  getSnapshot(): unknown
}
