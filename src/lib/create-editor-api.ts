import type { Editor } from '@tiptap/react'
import type {
  EditorApi,
  EditorAssetInsertion,
  EditorCommentInteraction,
  EditorStructuredInsertion,
  EditorTextSelection,
} from './editor-api'

/**
 * Binds a Tiptap editor to the {@link EditorApi} contract.
 *
 * This is the ONLY module that talks to the editor instance directly — the one
 * place `editor.chain()` / `editor.isActive()` / `editor.can()` may appear.
 */
export function createEditorApi(editor: Editor): EditorApi {
  const insertStructuredContent = ({
    target,
    content,
    provenance,
    selection,
  }: EditorStructuredInsertion): boolean => {
    if (!content.trim()) return false

    let position: number | { from: number; to: number }
    if (target === 'selection') {
      if (!selection) return false
      const currentText = editor.state.doc.textBetween(selection.from, selection.to, '\n')
      if (currentText !== selection.text) return false
      position = { from: selection.from, to: selection.to }
    } else if (target === 'end') {
      const isEmptyParagraph =
        editor.state.doc.childCount === 1 &&
        editor.state.doc.firstChild?.type.name === 'paragraph' &&
        editor.state.doc.firstChild.content.size === 0
      position = isEmptyParagraph
        ? { from: 0, to: editor.state.doc.content.size }
        : editor.state.doc.content.size
    } else {
      position = editor.state.selection.head
    }

    return editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.setMeta('aiInsertion', provenance)
        return true
      })
      .insertContentAt(position, content, { updateSelection: true })
      .run()
  }

  const insertAsset = (asset: EditorAssetInsertion): boolean => {
    if (!asset.assetId || !asset.title || !asset.renderer) return false

    return editor
      .chain()
      .focus()
      .insertContent({
        type: 'enterpriseAsset',
        attrs: {
          ...asset,
          instanceId: crypto.randomUUID(),
        },
      })
      .run()
  }

  const findCommentRange = (commentId: string): { from: number; to: number } | null => {
    let from: number | null = null
    let to: number | null = null

    editor.state.doc.descendants((node, position) => {
      if (!node.isText) return
      const hasComment = node.marks.some(
        (mark) =>
          mark.type.name === 'reviewComment' &&
          String(mark.attrs.commentId) === commentId,
      )
      if (!hasComment) return
      from = from === null ? position : Math.min(from, position)
      to = to === null ? position + node.nodeSize : Math.max(to, position + node.nodeSize)
    })

    return from !== null && to !== null ? { from, to } : null
  }

  const addCommentAnchor = (
    selection: EditorTextSelection,
    commentId: string,
  ): boolean => {
    if (!commentId || selection.from >= selection.to) return false
    const currentText = editor.state.doc.textBetween(selection.from, selection.to, '\n')
    if (currentText !== selection.text) return false

    return editor
      .chain()
      .focus()
      .setTextSelection({ from: selection.from, to: selection.to })
      .setMark('reviewComment', { commentId })
      .setTextSelection(selection.to)
      .run()
  }

  const removeCommentAnchor = (commentId: string): boolean => {
    const markType = editor.state.schema.marks.reviewComment
    if (!markType) return false

    const transaction = editor.state.tr
    editor.state.doc.descendants((node, position) => {
      if (!node.isText) return
      for (const mark of node.marks) {
        if (
          mark.type === markType &&
          String(mark.attrs.commentId) === commentId
        ) {
          transaction.removeMark(position, position + node.nodeSize, mark)
        }
      }
    })

    if (!transaction.docChanged) return false
    editor.view.dispatch(transaction)
    return true
  }

  const focusCommentAnchor = (commentId: string): boolean => {
    const range = findCommentRange(commentId)
    if (!range) return false
    return editor.chain().focus().setTextSelection(range).scrollIntoView().run()
  }

  const getActiveCommentId = (): string | null => {
    const { selection } = editor.state
    const directMark = selection.$from
      .marks()
      .find((mark) => mark.type.name === 'reviewComment')
    if (directMark) return String(directMark.attrs.commentId || '') || null

    let commentId: string | null = null
    if (!selection.empty) {
      editor.state.doc.nodesBetween(selection.from, selection.to, (node) => {
        const mark = node.marks.find((item) => item.type.name === 'reviewComment')
        if (mark && !commentId) commentId = String(mark.attrs.commentId || '') || null
      })
    }
    return commentId
  }

  const interactionFromElement = (
    type: EditorCommentInteraction['type'],
    element: HTMLElement,
  ): EditorCommentInteraction | null => {
    const commentId = element.dataset.commentId
    if (!commentId) return null
    const bounds = element.getBoundingClientRect()
    return {
      type,
      commentId,
      bounds: {
        top: bounds.top,
        right: bounds.right,
        bottom: bounds.bottom,
        left: bounds.left,
      },
    }
  }

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
      editor
        .chain()
        .focus()
        .command(({ state, tr }) => {
          const { from, to } = state.selection
          for (const markType of Object.values(state.schema.marks)) {
            if (markType.name !== 'reviewComment') tr.removeMark(from, to, markType)
          }
          return true
        })
        .clearNodes()
        .run()
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
    insertStructuredContent,
    insertAsset,
    addCommentAnchor,
    removeCommentAnchor,
    focusCommentAnchor,
    getActiveCommentId,
    setReviewMode: (enabled) => {
      if (enabled) editor.view.dom.dataset.reviewMode = 'enabled'
      else delete editor.view.dom.dataset.reviewMode
    },
    subscribeCommentInteractions: (listener) => {
      let previewedCommentId: string | null = null
      const findCommentElement = (target: EventTarget | null): HTMLElement | null => {
        const element =
          target instanceof HTMLElement
            ? target
            : target instanceof Node
              ? target.parentElement
              : null
        return element?.closest<HTMLElement>('[data-review-comment]') ?? null
      }
      const handlePointerDown = (event: PointerEvent) => {
        const element = findCommentElement(event.target)
        if (!element) return
        const interaction = interactionFromElement('open', element)
        if (interaction) listener(interaction)
      }
      const handleMouseOver = (event: MouseEvent) => {
        const element = findCommentElement(event.target)
        if (!element) return
        const interaction = interactionFromElement('preview', element)
        if (!interaction || interaction.commentId === previewedCommentId) return
        previewedCommentId = interaction.commentId
        listener(interaction)
      }
      const handleMouseOut = (event: MouseEvent) => {
        const element = findCommentElement(event.target)
        if (!element || element.contains(event.relatedTarget as Node | null)) return
        const interaction = interactionFromElement('leave', element)
        if (!interaction || interaction.commentId !== previewedCommentId) return
        previewedCommentId = null
        listener(interaction)
      }

      editor.view.dom.addEventListener('pointerdown', handlePointerDown, true)
      editor.view.dom.addEventListener('mouseover', handleMouseOver, true)
      editor.view.dom.addEventListener('mousemove', handleMouseOver, true)
      editor.view.dom.addEventListener('mouseout', handleMouseOut, true)
      return () => {
        editor.view.dom.removeEventListener('pointerdown', handlePointerDown, true)
        editor.view.dom.removeEventListener('mouseover', handleMouseOver, true)
        editor.view.dom.removeEventListener('mousemove', handleMouseOver, true)
        editor.view.dom.removeEventListener('mouseout', handleMouseOut, true)
      }
    },

    getTextSelection: () => {
      const { from, to, empty } = editor.state.selection
      if (empty) return null

      const text = editor.state.doc.textBetween(from, to, '\n')
      if (!text.trim()) return null

      const nativeSelection = editor.view.dom.ownerDocument.getSelection()
      const nativeRange = nativeSelection?.rangeCount ? nativeSelection.getRangeAt(0) : null
      const nativeRect =
        nativeRange &&
        !nativeRange.collapsed &&
        nativeSelection?.anchorNode &&
        editor.view.dom.contains(nativeSelection.anchorNode)
          ? nativeRange.getBoundingClientRect()
          : null

      if (nativeRect && (nativeRect.width > 0 || nativeRect.height > 0)) {
        return {
          from,
          to,
          text,
          bounds: {
            top: nativeRect.top,
            right: nativeRect.right,
            bottom: nativeRect.bottom,
            left: nativeRect.left,
          },
        }
      }

      const start = editor.view.coordsAtPos(from)
      const end = editor.view.coordsAtPos(to)
      return {
        from,
        to,
        text,
        bounds: {
          top: Math.min(start.top, end.top),
          right: Math.max(start.right, end.right),
          bottom: Math.max(start.bottom, end.bottom),
          left: Math.min(start.left, end.left),
        },
      }
    },
    replaceTextSelection: (selection, replacement) => {
      const currentText = editor.state.doc.textBetween(selection.from, selection.to, '\n')
      if (currentText !== selection.text || !replacement.trim()) return false

      const safeContent = replacement
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
        .replaceAll(/\r?\n/g, '<br>')

      return editor
        .chain()
        .focus()
        .insertContentAt({ from: selection.from, to: selection.to }, safeContent)
        .run()
    },
    clearTextSelection: () => {
      editor.chain().setTextSelection(editor.state.selection.to).focus().run()
    },
    focus: () => {
      editor.chain().focus().run()
    },

    subscribe: (listener) => {
      editor.on('transaction', listener)
      return () => {
        editor.off('transaction', listener)
      }
    },
    getSnapshot: () => editor.state,
  }
}
