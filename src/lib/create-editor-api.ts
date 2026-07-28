import type { Editor } from '@tiptap/react'
import { Fragment } from '@tiptap/pm/model'
import { NodeSelection } from '@tiptap/pm/state'
import type {
  EditorApi,
  EditorAssetInsertion,
  EditorCommentInteraction,
  EditorDocumentChange,
  EditorDocumentNode,
  EditorStructuredInsertion,
  EditorTextSelection,
  EditorTrackChangeInteraction,
} from './editor-api'
import { normalizeSerializedField } from '../forms/services/formSerializer'
import { updateFormField as applyFormFieldPatch } from '../forms/services/formEngine'
import type { FormField, FormFieldDocumentEntry } from '../forms/types/field'
import { resolvePageMetrics } from '../layout/services/pageMetrics'
import { paginateBlocks } from '../layout/services/paginationEngine'
import type { PageLayout } from '../layout/types/layout'
import type { PaginationSnapshot } from '../layout/types/page'
import {
  TRACK_CHANGES_INTERNAL_META,
  type TrackChangeSegment,
  type TrackChangesStorage,
} from '../review/trackChanges/editor/TrackChangeMark'

/**
 * Binds a Tiptap editor to the {@link EditorApi} contract.
 *
 * This is the ONLY module that talks to the editor instance directly — the one
 * place `editor.chain()` / `editor.isActive()` / `editor.can()` may appear.
 */
export function createEditorApi(editor: Editor): EditorApi {
  const REMOTE_DOCUMENT_META = 'techcodieCollaborationRemote'
  const trackChangesStorage = (
    editor.storage as unknown as { trackChange: TrackChangesStorage }
  ).trackChange
  let pageLayout: PageLayout | null = null
  let paginationFrame: number | null = null
  let editableBeforePreview = editor.isEditable
  let manualPageBreaks: { id: string; position: number }[] = []
  let resizeObserver: ResizeObserver | null = null
  const paginationListeners = new Set<(snapshot: PaginationSnapshot) => void>()
  const documentChangeListeners = new Set<(change: EditorDocumentChange) => void>()
  let paginationSnapshot: PaginationSnapshot = {
    pages: [{
      id: 'page-1',
      index: 0,
      number: 1,
      top: 0,
      height: 0,
      contentTop: 0,
      contentHeight: 0,
    }],
    breaks: [],
    currentPage: 1,
    pageWidth: 0,
    pageHeight: 0,
    pageGap: 24,
  }

  const getPageSurface = () =>
    editor.view.dom.closest<HTMLElement>('[data-document-page-surface]')

  const resetPaginationStyles = () => {
    const surface = getPageSurface()
    if (!surface) return
    delete surface.dataset.pageLayout
    surface.style.removeProperty('--page-width')
    surface.style.removeProperty('--page-height')
    surface.style.removeProperty('--page-gap')
    surface.style.removeProperty('--page-margin-top')
    surface.style.removeProperty('--page-margin-right')
    surface.style.removeProperty('--page-margin-bottom')
    surface.style.removeProperty('--page-margin-left')
    surface.style.removeProperty('min-height')
    for (const child of editor.view.dom.children) {
      if (!(child instanceof HTMLElement)) continue
      child.style.removeProperty('margin-top')
      delete child.dataset.pageBreakBefore
    }
  }

  const notifyPagination = () => {
    for (const listener of paginationListeners) listener(paginationSnapshot)
  }

  const applyPagination = () => {
    paginationFrame = null
    const surface = getPageSurface()
    if (!surface || !pageLayout) {
      resetPaginationStyles()
      return
    }

    const metrics = resolvePageMetrics(pageLayout)
    surface.dataset.pageLayout = 'enabled'
    surface.dataset.pageOrientation = pageLayout.orientation
    surface.style.setProperty('--page-width', `${metrics.width}px`)
    surface.style.setProperty('--page-aspect-ratio', String(metrics.height / metrics.width))

    const scale = Math.min(1, surface.clientWidth / metrics.width)
    const pageWidth = metrics.width * scale
    const pageHeight = metrics.height * scale
    const marginTop = metrics.marginTop * scale
    const marginRight = metrics.marginRight * scale
    const marginBottom = metrics.marginBottom * scale
    const marginLeft = metrics.marginLeft * scale
    const contentHeight = metrics.contentHeight * scale
    const pageGap = scale < 0.7 ? 12 : scale < 0.9 ? 18 : 24

    surface.style.setProperty('--page-height', `${pageHeight}px`)
    surface.style.setProperty('--page-gap', `${pageGap}px`)
    surface.style.setProperty('--page-margin-top', `${marginTop}px`)
    surface.style.setProperty('--page-margin-right', `${marginRight}px`)
    surface.style.setProperty('--page-margin-bottom', `${marginBottom}px`)
    surface.style.setProperty('--page-margin-left', `${marginLeft}px`)

    const blocks = [...editor.view.dom.children].flatMap((child) => {
      if (!(child instanceof HTMLElement)) return []
      child.style.removeProperty('margin-top')
      delete child.dataset.pageBreakBefore
      return [{
        element: child,
        position: editor.view.posAtDOM(child, 0),
        top: child.offsetTop,
        height: child.getBoundingClientRect().height,
      }]
    })
    const result = paginateBlocks({
      blocks,
      manualBreaks: [...manualPageBreaks].sort((left, right) => left.position - right.position),
      pageHeight,
      contentHeight,
      marginTop,
      pageGap,
    })

    for (const offset of result.offsets) {
      const block = blocks.find((item) => item.position === offset.position)
      if (!block) continue
      const baseMargin = Number.parseFloat(getComputedStyle(block.element).marginTop) || 0
      block.element.style.marginTop = `${baseMargin + offset.offset}px`
      block.element.dataset.pageBreakBefore = offset.manualBreakId ? 'manual' : 'automatic'
    }

    const surfaceHeight =
      result.pages.length * pageHeight + Math.max(0, result.pages.length - 1) * pageGap
    surface.style.minHeight = `${surfaceHeight}px`
    const surfaceBounds = surface.getBoundingClientRect()
    const caret = editor.view.coordsAtPos(editor.state.selection.head)
    const currentPage = Math.min(
      result.pages.length,
      Math.max(1, Math.floor((caret.top - surfaceBounds.top) / (pageHeight + pageGap)) + 1),
    )
    paginationSnapshot = {
      pages: result.pages,
      breaks: result.breaks,
      currentPage,
      pageWidth,
      pageHeight,
      pageGap,
    }
    notifyPagination()
  }

  const schedulePagination = () => {
    if (paginationFrame !== null) cancelAnimationFrame(paginationFrame)
    paginationFrame = requestAnimationFrame(applyPagination)
  }

  editor.on('transaction', ({ transaction }) => {
    if (transaction.docChanged && manualPageBreaks.length > 0) {
      manualPageBreaks = manualPageBreaks.map((pageBreak) => ({
        ...pageBreak,
        position: transaction.mapping.map(pageBreak.position, 1),
      }))
    }
    if (pageLayout) schedulePagination()
    if (transaction.docChanged || transaction.selectionSet) {
      const change: EditorDocumentChange = {
        origin: transaction.getMeta(REMOTE_DOCUMENT_META) ? 'remote' : 'local',
        docChanged: transaction.docChanged,
        selectionChanged: transaction.selectionSet,
      }
      for (const listener of documentChangeListeners) listener(change)
    }
  })
  editor.on('destroy', () => {
    resizeObserver?.disconnect()
    if (paginationFrame !== null) cancelAnimationFrame(paginationFrame)
  })
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

  interface TrackChangeSegmentRange {
    from: number
    to: number
    segment: TrackChangeSegment
  }

  const findTrackChangeSegments = (changeId: string): TrackChangeSegmentRange[] => {
    const segments: TrackChangeSegmentRange[] = []
    editor.state.doc.descendants((node, position) => {
      if (!node.isText) return
      const mark = node.marks.find(
        (item) =>
          item.type.name === 'trackChange' &&
          String(item.attrs.changeId) === changeId,
      )
      if (!mark) return
      const segment = mark.attrs.segment as TrackChangeSegment
      const previous = segments.at(-1)
      if (previous && previous.to === position && previous.segment === segment) {
        previous.to = position + node.nodeSize
        return
      }
      segments.push({
        from: position,
        to: position + node.nodeSize,
        segment,
      })
    })
    return segments
  }

  const findTrackChangeRange = (
    changeId: string,
  ): { from: number; to: number } | null => {
    const segments = findTrackChangeSegments(changeId)
    if (segments.length === 0) return null
    return {
      from: Math.min(...segments.map((segment) => segment.from)),
      to: Math.max(...segments.map((segment) => segment.to)),
    }
  }

  const insertTrackedSuggestion = (content: string): boolean => {
    const lines = content
      .trim()
      .split(/\r?\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
    const markType = editor.state.schema.marks.trackChange
    const paragraphType = editor.state.schema.nodes.paragraph
    if (!lines.length || !markType || !paragraphType) return false

    const changeId = crypto.randomUUID()
    const mark = markType.create({
      changeId,
      changeType: 'insert',
      segment: 'insertion',
    })
    const paragraphs = lines.map((line) =>
      paragraphType.create(null, editor.state.schema.text(line, [mark])),
    )
    const position = editor.state.doc.content.size
    const transaction = editor.state.tr
      .setMeta(TRACK_CHANGES_INTERNAL_META, true)
      .insert(position, Fragment.fromArray(paragraphs))
    editor.view.dispatch(transaction)
    const range = findTrackChangeRange(changeId)
    if (!range) return false
    const draft = {
      id: changeId,
      type: 'insert' as const,
      createdAt: Date.now(),
      range,
      before: '',
      after: lines.join('\n'),
    }
    queueMicrotask(() => {
      for (const listener of trackChangesStorage.listeners) listener(draft)
    })
    editor.chain().focus().setTextSelection(range.to).scrollIntoView().run()
    return true
  }

  const removeTrackChangeMarks = (
    changeId: string,
    transaction: typeof editor.state.tr,
  ) => {
    const markType = editor.state.schema.marks.trackChange
    if (!markType) return
    editor.state.doc.descendants((node, position) => {
      if (!node.isText) return
      for (const mark of node.marks) {
        if (
          mark.type === markType &&
          String(mark.attrs.changeId) === changeId
        ) {
          transaction.removeMark(position, position + node.nodeSize, mark)
        }
      }
    })
  }

  const resolveTrackChange = (
    changeId: string,
    decision: 'accept' | 'reject',
  ): boolean => {
    const segments = findTrackChangeSegments(changeId)
    if (segments.length === 0) return false
    const firstSegment = segments[0]
    const firstNode = firstSegment
      ? editor.state.doc.nodeAt(firstSegment.from)
      : null
    const changeMark = firstNode?.marks.find(
      (mark) =>
        mark.type.name === 'trackChange' &&
        String(mark.attrs.changeId) === changeId,
    )
    const changeType = String(changeMark?.attrs.changeType || '')
    const transaction = editor.state.tr.setMeta(TRACK_CHANGES_INTERNAL_META, true)

    if (changeType === 'format' && decision === 'reject') {
      const snapshot = trackChangesStorage.formatSnapshots.get(changeId)
      const range = findTrackChangeRange(changeId)
      if (!snapshot || !range) return false
      transaction.replaceRange(range.from, range.to, snapshot.before)
    } else {
      removeTrackChangeMarks(changeId, transaction)
      const segmentToDelete =
        decision === 'accept' ? 'deletion' : 'insertion'
      const deletedSegments = segments
        .filter((segment) => segment.segment === segmentToDelete)
        .sort((left, right) => right.from - left.from)
      for (const segment of deletedSegments) {
        transaction.delete(segment.from, segment.to)
      }
    }

    if (!transaction.docChanged) return false
    trackChangesStorage.formatSnapshots.delete(changeId)
    editor.view.dispatch(transaction)
    return true
  }

  const trackChangeInteractionFromElement = (
    type: EditorTrackChangeInteraction['type'],
    element: HTMLElement,
  ): EditorTrackChangeInteraction | null => {
    const changeId = element.dataset.changeId
    if (!changeId) return null
    const bounds = element.getBoundingClientRect()
    return {
      type,
      changeId,
      bounds: {
        top: bounds.top,
        right: bounds.right,
        bottom: bounds.bottom,
        left: bounds.left,
      },
    }
  }

  const selectionBounds = (from: number, to: number) => {
    const start = editor.view.coordsAtPos(from)
    const end = editor.view.coordsAtPos(to)
    return {
      top: Math.min(start.top, end.top),
      right: Math.max(start.right, end.right),
      bottom: Math.max(start.bottom, end.bottom),
      left: Math.min(start.left, end.left),
    }
  }

  const getFormFields = (): FormFieldDocumentEntry[] => {
    const fields: FormFieldDocumentEntry[] = []
    editor.state.doc.descendants((node, position) => {
      if (node.type.name !== 'formField') return
      const field = normalizeSerializedField(node.attrs.field)
      if (field) fields.push({ field, from: position, to: position + node.nodeSize })
    })
    return fields
  }

  const getFormField = (fieldId: string): FormFieldDocumentEntry | null =>
    getFormFields().find((entry) => entry.field.id === fieldId) ?? null

  const setFormField = (entry: FormFieldDocumentEntry, field: FormField): boolean => {
    const node = editor.state.doc.nodeAt(entry.from)
    if (!node || node.type.name !== 'formField') return false
    const transaction = editor.state.tr.setNodeMarkup(entry.from, undefined, { field })
    editor.view.dispatch(transaction)
    return true
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
            if (
              markType.name !== 'reviewComment' &&
              markType.name !== 'trackChange'
            ) {
              tr.removeMark(from, to, markType)
            }
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
            formField: ({ node }) => {
              const field = normalizeSerializedField(node.attrs.field)
              return field ? `[Form field: ${field.label || field.type}]` : '[Form field]'
            },
          },
        })
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim(),
    getDocumentSnapshot: () => structuredClone(editor.getJSON()) as EditorDocumentNode,
    replaceDocumentSnapshot: (snapshot, options) => editor
      .chain()
      .command(({ tr }) => {
        if (options?.origin === 'remote') tr.setMeta(REMOTE_DOCUMENT_META, true)
        return true
      })
      .setContent(snapshot, { emitUpdate: true, errorOnInvalidContent: true })
      .run(),
    insertStructuredContent,
    insertAsset,
    insertFormField: (field) => {
      const normalized = normalizeSerializedField(field)
      if (!normalized || getFormField(normalized.id)) return false
      const didInsert = editor.chain().focus().insertContent({
        type: 'formField',
        attrs: { field: normalized },
      }).run()
      if (didInsert) queueMicrotask(() => {
        const entry = getFormField(normalized.id)
        if (entry) editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, entry.from)))
      })
      return didInsert
    },
    updateFormField: (fieldId, patch) => {
      const entry = getFormField(fieldId)
      return entry ? setFormField(entry, applyFormFieldPatch(entry.field, patch)) : false
    },
    removeFormField: (fieldId) => {
      const entry = getFormField(fieldId)
      if (!entry) return false
      editor.view.dispatch(editor.state.tr.delete(entry.from, entry.to))
      return true
    },
    getFormFields,
    getSelectedFormField: () => {
      const selection = editor.state.selection
      if (!(selection instanceof NodeSelection) || selection.node.type.name !== 'formField') return null
      const field = normalizeSerializedField(selection.node.attrs.field)
      return field ? { field, from: selection.from, to: selection.to } : null
    },
    focusFormField: (fieldId) => {
      const entry = getFormField(fieldId)
      if (!entry) return false
      editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, entry.from)).scrollIntoView())
      editor.view.focus()
      return true
    },
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
    setSuggestionMode: (enabled) => {
      trackChangesStorage.enabled = enabled
      if (enabled) editor.view.dom.dataset.suggestionMode = 'enabled'
      else delete editor.view.dom.dataset.suggestionMode
    },
    insertTrackedSuggestion,
    subscribeTrackChanges: (listener) => {
      trackChangesStorage.listeners.add(listener)
      return () => trackChangesStorage.listeners.delete(listener)
    },
    resolveTrackChange,
    focusTrackChange: (changeId, fallbackRange) => {
      const liveRange = findTrackChangeRange(changeId)
      const documentEnd = editor.state.doc.content.size
      const range = liveRange ?? (fallbackRange
        ? {
            from: Math.min(Math.max(fallbackRange.from, 1), documentEnd),
            to: Math.min(Math.max(fallbackRange.to, 1), documentEnd),
          }
        : null)
      if (!range) return false
      const selection = {
        from: Math.min(range.from, range.to),
        to: Math.max(range.from, range.to),
      }
      return editor.chain().focus().setTextSelection(selection).scrollIntoView().run()
    },
    subscribeTrackChangeInteractions: (listener) => {
      let previewedChangeId: string | null = null
      const findChangeElement = (target: EventTarget | null): HTMLElement | null => {
        const element =
          target instanceof HTMLElement
            ? target
            : target instanceof Node
              ? target.parentElement
              : null
        return element?.closest<HTMLElement>('[data-track-change]') ?? null
      }
      const handlePointerDown = (event: PointerEvent) => {
        const element = findChangeElement(event.target)
        if (!element) return
        const interaction = trackChangeInteractionFromElement('open', element)
        if (interaction) listener(interaction)
      }
      const handleMouseOver = (event: MouseEvent) => {
        const element = findChangeElement(event.target)
        if (!element) return
        const interaction = trackChangeInteractionFromElement('preview', element)
        if (!interaction || interaction.changeId === previewedChangeId) return
        previewedChangeId = interaction.changeId
        listener(interaction)
      }
      const handleMouseOut = (event: MouseEvent) => {
        const element = findChangeElement(event.target)
        if (!element || element.contains(event.relatedTarget as Node | null)) return
        const interaction = trackChangeInteractionFromElement('leave', element)
        if (!interaction || interaction.changeId !== previewedChangeId) return
        previewedChangeId = null
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

    setPageLayout: (layout) => {
      pageLayout = layout ? structuredClone(layout) : null
      if (!pageLayout) {
        resetPaginationStyles()
        return
      }
      if (!resizeObserver) {
        const surface = getPageSurface()
        if (surface) {
          resizeObserver = new ResizeObserver(schedulePagination)
          resizeObserver.observe(surface)
        }
      }
      schedulePagination()
    },
    getPaginationSnapshot: () => paginationSnapshot,
    subscribePagination: (listener) => {
      paginationListeners.add(listener)
      listener(paginationSnapshot)
      return () => paginationListeners.delete(listener)
    },
    insertPageBreak: () => {
      const selectionPosition = editor.state.selection.head
      const nextBlock = [...editor.view.dom.children].find((child) => {
        if (!(child instanceof HTMLElement)) return false
        return editor.view.posAtDOM(child, 0) >= selectionPosition
      })
      const position = nextBlock instanceof HTMLElement
        ? editor.view.posAtDOM(nextBlock, 0)
        : selectionPosition
      if (manualPageBreaks.some((pageBreak) => Math.abs(pageBreak.position - position) <= 1)) {
        return false
      }
      manualPageBreaks.push({ id: crypto.randomUUID(), position })
      schedulePagination()
      return true
    },
    removePageBreak: (pageBreakId) => {
      const next = manualPageBreaks.filter((pageBreak) => pageBreak.id !== pageBreakId)
      if (next.length === manualPageBreaks.length) return false
      manualPageBreaks = next
      schedulePagination()
      return true
    },
    setPrintPreviewMode: (enabled) => {
      if (enabled) {
        editableBeforePreview = editor.isEditable
        editor.setEditable(false)
      } else {
        editor.setEditable(editableBeforePreview)
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

      return {
        from,
        to,
        text,
        bounds: selectionBounds(from, to),
      }
    },
    getSelectionRange: () => {
      const { from, to } = editor.state.selection
      return { from, to }
    },
    getRangeBounds: (from, to) => {
      const documentEnd = editor.state.doc.content.size
      if (from < 0 || to < 0 || from > documentEnd || to > documentEnd) return null
      return selectionBounds(Math.min(from, to), Math.max(from, to))
    },
    findTextSelection: (text) => {
      const trimmed = text.trim()
      const candidates = [
        trimmed,
        trimmed.replace(/^#{1,6}\s+/, ''),
        trimmed.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, ''),
      ].filter((candidate, index, values) => candidate && values.indexOf(candidate) === index)
      let found: EditorTextSelection | null = null
      editor.state.doc.descendants((node, position) => {
        if (found || !node.isTextblock) return !found
        for (const candidate of candidates) {
          const offset = node.textContent.indexOf(candidate)
          if (offset < 0) continue
          const from = position + 1 + offset
          const to = from + candidate.length
          found = { from, to, text: candidate, bounds: selectionBounds(from, to) }
          break
        }
        return false
      })
      return found
    },
    focusTextSelection: (selection) => {
      const currentText = editor.state.doc.textBetween(selection.from, selection.to, '\n')
      if (currentText !== selection.text) return false
      return editor.chain().focus().setTextSelection({ from: selection.from, to: selection.to }).scrollIntoView().run()
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
    subscribeDocumentChanges: (listener) => {
      documentChangeListeners.add(listener)
      return () => documentChangeListeners.delete(listener)
    },
    getSnapshot: () => editor.state,
  }
}
