import type { Editor } from '@tiptap/react'

export type HeadingLevel = 1 | 2 | 3
export type TextAlignment = 'left' | 'center' | 'right' | 'justify'

/**
 * Framework-agnostic editor command surface.
 *
 * This interface is the public contract every UI (toolbar today; bubble menu,
 * slash menu and command palette later) depends on. It deliberately exposes no
 * Tiptap types, so the underlying editor can be swapped without touching any
 * consumer.
 */
export interface EditorApi {
  // History
  undo(): void
  redo(): void
  canUndo(): boolean
  canRedo(): boolean

  // Block type
  setParagraph(): void
  isParagraph(): boolean
  toggleHeading(level: HeadingLevel): void
  isHeading(level: HeadingLevel): boolean

  // Inline marks
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

  // Lists
  toggleBulletList(): void
  isBulletList(): boolean
  toggleOrderedList(): void
  isOrderedList(): boolean
  toggleTaskList(): void
  isTaskList(): boolean

  // Alignment
  setTextAlign(align: TextAlignment): void
  isTextAlign(align: TextAlignment): boolean

  // Blocks
  toggleBlockquote(): void
  isBlockquote(): boolean
  toggleCodeBlock(): void
  isCodeBlock(): boolean
  insertHorizontalRule(): void
  clearFormatting(): void

  // Document
  /** Returns readable plain text without mutating editor state. */
  getDocumentText(): string

  // Reactivity — an external-store contract consumed via useSyncExternalStore.
  /** Subscribe to editor changes; returns an unsubscribe function. */
  subscribe(listener: () => void): () => void
  /** Opaque snapshot whose identity changes on every edit. */
  getSnapshot(): unknown
}

/**
 * Binds a Tiptap editor to the {@link EditorApi} contract.
 *
 * This is the ONLY module that talks to the editor instance directly — the one
 * place `editor.chain()` / `editor.isActive()` / `editor.can()` may appear.
 */
export function createEditorApi(editor: Editor): EditorApi {
  return {
    undo: () => {
      editor.chain().focus().undo().run()
    },
    redo: () => {
      editor.chain().focus().redo().run()
    },
    canUndo: () => editor.can().undo(),
    canRedo: () => editor.can().redo(),

    setParagraph: () => {
      editor.chain().focus().setParagraph().run()
    },
    isParagraph: () => editor.isActive('paragraph'),
    toggleHeading: (level) => {
      editor.chain().focus().toggleHeading({ level }).run()
    },
    isHeading: (level) => editor.isActive('heading', { level }),

    toggleBold: () => {
      editor.chain().focus().toggleBold().run()
    },
    isBold: () => editor.isActive('bold'),
    toggleItalic: () => {
      editor.chain().focus().toggleItalic().run()
    },
    isItalic: () => editor.isActive('italic'),
    toggleUnderline: () => {
      editor.chain().focus().toggleUnderline().run()
    },
    isUnderline: () => editor.isActive('underline'),
    toggleStrike: () => {
      editor.chain().focus().toggleStrike().run()
    },
    isStrike: () => editor.isActive('strike'),
    toggleInlineCode: () => {
      editor.chain().focus().toggleCode().run()
    },
    isInlineCode: () => editor.isActive('code'),
    toggleHighlight: () => {
      editor.chain().focus().toggleHighlight().run()
    },
    isHighlight: () => editor.isActive('highlight'),

    toggleBulletList: () => {
      editor.chain().focus().toggleBulletList().run()
    },
    isBulletList: () => editor.isActive('bulletList'),
    toggleOrderedList: () => {
      editor.chain().focus().toggleOrderedList().run()
    },
    isOrderedList: () => editor.isActive('orderedList'),
    toggleTaskList: () => {
      editor.chain().focus().toggleTaskList().run()
    },
    isTaskList: () => editor.isActive('taskList'),

    setTextAlign: (align) => {
      editor.chain().focus().setTextAlign(align).run()
    },
    isTextAlign: (align) => editor.isActive({ textAlign: align }),

    toggleBlockquote: () => {
      editor.chain().focus().toggleBlockquote().run()
    },
    isBlockquote: () => editor.isActive('blockquote'),
    toggleCodeBlock: () => {
      editor.chain().focus().toggleCodeBlock().run()
    },
    isCodeBlock: () => editor.isActive('codeBlock'),
    insertHorizontalRule: () => {
      editor.chain().focus().setHorizontalRule().run()
    },
    clearFormatting: () => {
      editor.chain().focus().unsetAllMarks().clearNodes().run()
    },

    getDocumentText: () =>
      editor
        .getText({
          blockSeparator: '\n',
          textSerializers: {
            heading: ({ node }) =>
              `${'#'.repeat(Number(node.attrs.level) || 1)} ${node.textContent}`,
            listItem: ({ node, parent, index }) =>
              `${parent.type.name === 'orderedList' ? `${Number(parent.attrs.start ?? 1) + index}.` : '-'} ${node.textContent}`,
            taskItem: ({ node }) => `- [${node.attrs.checked ? 'x' : ' '}] ${node.textContent}`,
            horizontalRule: () => '---',
            hardBreak: () => '\n',
          },
        })
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim(),

    subscribe: (listener) => {
      editor.on('transaction', listener)
      return () => {
        editor.off('transaction', listener)
      }
    },
    getSnapshot: () => editor.state,
  }
}
