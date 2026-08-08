import type { Editor } from '@tiptap/react'
import { Fragment } from '@tiptap/pm/model'
import { NodeSelection } from '@tiptap/pm/state'
import type {
  EditorApi,
  EditorAssetInsertion,
  EditorCommentInteraction,
  EditorDictationUpdate,
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
import {
  createPaginationOffsetPlugin,
  paginationOffsetMapsEqual,
  paginationOffsetPluginKey,
  type PaginationOffsetMap,
} from '../layout/editor/PaginationOffsetPlugin'
import type { PageLayout } from '../layout/types/layout'
import type { PaginationSnapshot } from '../layout/types/page'
import {
  TRACK_CHANGES_INTERNAL_META,
  type TrackChangeSegment,
  type TrackChangesStorage,
} from '../review/trackChanges/editor/TrackChangeMark'

const HAS_URL_SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:/
const RELATIVE_HREF_PREFIXES = ['#', '/', '?']

/**
 * A bare domain typed into the Link control (`example.com`, no `https://`)
 * would otherwise be stored as-is and resolve as a browser-relative URL
 * (`https://current-site.com/example.com`) instead of navigating anywhere
 * useful. Anything that already looks like an absolute URL with a scheme, or
 * an intentionally relative reference (`#anchor`, `/path`, `?query`), is left
 * untouched — this only prepends a scheme to what's otherwise a bare
 * host/path. The Tiptap Link extension's own `isAllowedUri` (see
 * `createEditorExtensions` in `src/extensions/index.ts`) still validates the
 * final value against its scheme allowlist regardless of this normalization.
 */
function normalizeLinkHref(href: string): string {
  if (HAS_URL_SCHEME.test(href)) return href
  if (RELATIVE_HREF_PREFIXES.some((prefix) => href.startsWith(prefix))) return href
  return `https://${href}`
}

/**
 * Binds a Tiptap editor to the {@link EditorApi} contract.
 *
 * This is the ONLY module that talks to the editor instance directly — the one
 * place `editor.chain()` / `editor.isActive()` / `editor.can()` may appear.
 */
export function createEditorApi(editor: Editor): EditorApi {
  const REMOTE_DOCUMENT_META = 'techcodieCollaborationRemote'
  // Marks a transaction as pagination's own internal decoration update so the
  // transaction listener below doesn't treat it as new content to re-paginate
  // — otherwise every pagination recompute would immediately reschedule
  // another one, forever.
  const PAGINATION_INTERNAL_META = 'techcodiePaginationInternal'
  // Marks a transaction as dictation's own live-preview update so the
  // conflict guard below doesn't mistake it for the user editing elsewhere
  // and abandon the in-progress dictation range.
  const DICTATION_INTERNAL_META = 'techcodieDictationInternal'
  let dictationRange: { from: number; to: number } | null = null
  const trackChangesStorage = (
    editor.storage as unknown as { trackChange: TrackChangesStorage }
  ).trackChange
  // Guarded so re-invoking createEditorApi() for the same live editor
  // instance (e.g. React StrictMode's double-invoke of the useMemo this is
  // built in) doesn't try to register a second plugin under the same key,
  // which ProseMirror rejects outright.
  if (!paginationOffsetPluginKey.getState(editor.state)) {
    editor.registerPlugin(createPaginationOffsetPlugin())
  }
  let pageLayout: PageLayout | null = null
  let paginationFrame: number | null = null
  let paginationTimeout: ReturnType<typeof setTimeout> | null = null
  let paginationScheduledAt: number | null = null
  let editableBeforePreview = editor.isEditable
  let resizeObserver: ResizeObserver | null = null
  let scrollListenerAttached = false
  let scrollFrame: number | null = null
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

  // Manual breaks live as real `pageBreak` nodes in the document rather than
  // separately-tracked state, so their positions are always read fresh from
  // the current doc — no remapping through transactions needed, and
  // insert/remove naturally participate in undo/redo.
  const getManualPageBreaks = (): { id: string; position: number }[] => {
    const breaks: { id: string; position: number }[] = []
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'pageBreak') {
        breaks.push({ id: (node.attrs.id as string | null) ?? '', position: pos })
      }
    })
    return breaks
  }

  const clearPaginationOffsets = () => {
    if (paginationOffsetPluginKey.getState(editor.state)?.offsets.size) {
      editor.view.dispatch(
        editor.state.tr
          .setMeta(paginationOffsetPluginKey, new Map())
          .setMeta('addToHistory', false)
          .setMeta(PAGINATION_INTERNAL_META, true),
      )
    }
  }

  const resetPaginationStyles = () => {
    const surface = getPageSurface()
    if (surface) {
      delete surface.dataset.pageLayout
      surface.style.removeProperty('--page-width')
      surface.style.removeProperty('--page-height')
      surface.style.removeProperty('--page-gap')
      surface.style.removeProperty('--page-margin-top')
      surface.style.removeProperty('--page-margin-right')
      surface.style.removeProperty('--page-margin-bottom')
      surface.style.removeProperty('--page-margin-left')
      surface.style.removeProperty('--content-height')
      surface.style.removeProperty('min-height')
    }
    clearPaginationOffsets()
  }

  const notifyPagination = () => {
    for (const listener of paginationListeners) listener(paginationSnapshot)
  }

  // Which page counts as "current" is read by the status bar and page
  // navigator, and must track what's actually visible on screen while
  // scrolling — a caret that hasn't moved (or was never placed, e.g. after
  // opening a document read-only) shouldn't pin the indicator to a stale
  // page. `surfaceBounds.top` is viewport-relative and shifts with scroll,
  // so anchoring off it (rather than off `coordsAtPos`, which moves with the
  // caret, not the viewport) makes this genuinely scroll-driven. The
  // reference point is 30% down the viewport rather than the very top edge,
  // matching where a reader's attention actually sits when a page boundary
  // is scrolled just above the fold.
  const computeCurrentPage = (
    surfaceBounds: { top: number },
    pageHeight: number,
    pageGap: number,
    pageCount: number,
  ): number => {
    if (pageHeight <= 0 || pageCount <= 0) return 1
    const viewportReferenceY = window.innerHeight * 0.3
    const yWithinSurface = viewportReferenceY - surfaceBounds.top
    return Math.min(
      pageCount,
      Math.max(1, Math.floor(yWithinSurface / (pageHeight + pageGap)) + 1),
    )
  }

  const updateCurrentPageFromScroll = () => {
    scrollFrame = null
    const surface = getPageSurface()
    if (!surface || !pageLayout || paginationSnapshot.pageHeight <= 0) return
    const currentPage = computeCurrentPage(
      surface.getBoundingClientRect(),
      paginationSnapshot.pageHeight,
      paginationSnapshot.pageGap,
      paginationSnapshot.pages.length,
    )
    if (currentPage === paginationSnapshot.currentPage) return
    paginationSnapshot = { ...paginationSnapshot, currentPage }
    notifyPagination()
  }

  const handleScroll = () => {
    if (scrollFrame !== null) return
    scrollFrame = requestAnimationFrame(updateCurrentPageFromScroll)
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
    // Real visible spacing between independent page cards (see PageIndicator.tsx's
    // page-card layer) — 40-60px at full scale, tapering down at smaller zoom
    // levels so the gap doesn't dominate a shrunk page.
    const pageGap = scale < 0.7 ? 32 : scale < 0.9 ? 44 : 56

    surface.style.setProperty('--page-height', `${pageHeight}px`)
    surface.style.setProperty('--page-gap', `${pageGap}px`)
    surface.style.setProperty('--page-margin-top', `${marginTop}px`)
    surface.style.setProperty('--page-margin-right', `${marginRight}px`)
    surface.style.setProperty('--page-margin-bottom', `${marginBottom}px`)
    surface.style.setProperty('--page-margin-left', `${marginLeft}px`)
    // Defense in depth for editor.css's fallback mask on .tiptap: the
    // per-block margin-top push below is the real, primary mechanism (see
    // paginateBlocks()) — this only guards the case where a block's DOM node
    // gets replaced by something outside pagination's own writes shortly
    // after an edit, discarding its push before the self-healing re-checks
    // below catch up. Not used as the primary pagination mechanism.
    surface.style.setProperty('--content-height', `${contentHeight}px`)

    // `top` is rebuilt as a pure running sum of each block's own natural
    // margin and height — deliberately NOT read from `child.offsetTop`.
    // offsetTop reflects live cascaded document flow: a margin-top pushed
    // onto an earlier block also shifts every later sibling's offsetTop
    // down by that same amount (normal CSS box flow), and that shift is
    // indistinguishable from "natural" position once baked into offsetTop.
    // paginateBlocks() already re-adds its own accumulated offset on top of
    // whatever `top` values it's given, so feeding it offsetTop-derived
    // values that already contain earlier pages' pushes double-counts every
    // earlier push on the second and subsequent recompute — each pass
    // compounding the error further. A single paste can trigger more than
    // one recompute in quick succession (observed: 2+ for one large paste),
    // so this wasn't just a rapid-typing edge case. Only each block's own
    // currently-applied push still needs recovering (from the offset
    // plugin's in-memory state, not the DOM — see PaginationOffsetPlugin.ts)
    // to back out its natural CSS margin; its position never does.
    const currentOffsets = paginationOffsetPluginKey.getState(editor.state)?.offsets ?? new Map()
    let naturalTop = 0
    const blocks = [...editor.view.dom.children].flatMap((child) => {
      if (!(child instanceof HTMLElement)) return []
      // posAtDOM(child, 0) resolves to the position just INSIDE the block
      // (its content start), one past the block node's own start position —
      // the same convention doc.descendants() uses for manual page breaks,
      // and the one PaginationOffsetPlugin's doc.nodeAt(position) needs to
      // resolve back to the block node itself rather than whatever sits at
      // its first content offset.
      const position = editor.view.posAtDOM(child, 0) - 1
      const appliedPush = currentOffsets.get(position)?.pushPx ?? 0
      const baseMarginTop = (Number.parseFloat(getComputedStyle(child).marginTop) || 0) - appliedPush
      const height = child.getBoundingClientRect().height
      const top = naturalTop + baseMarginTop
      naturalTop = top + height
      return [{ element: child, position, top, height, baseMarginTop }]
    })
    const result = paginateBlocks({
      blocks,
      manualBreaks: getManualPageBreaks().sort((left, right) => left.position - right.position),
      pageHeight,
      contentHeight,
      marginTop,
      pageGap,
    })

    // Applied as ProseMirror decorations (see PaginationOffsetPlugin.ts)
    // rather than direct DOM writes, so the push is never silently dropped by
    // a ProseMirror-initiated redraw that happens outside this function.
    const nextOffsets: PaginationOffsetMap = new Map()
    for (const offset of result.offsets) {
      const block = blocks.find((item) => item.position === offset.position)
      if (!block) continue
      nextOffsets.set(offset.position, {
        pushPx: offset.offset,
        marginTopPx: block.baseMarginTop + offset.offset,
        pageBreakBefore: offset.manualBreakId ? 'manual' : 'automatic',
      })
    }
    if (!paginationOffsetMapsEqual(currentOffsets, nextOffsets)) {
      editor.view.dispatch(
        editor.state.tr
          .setMeta(paginationOffsetPluginKey, nextOffsets)
          .setMeta('addToHistory', false)
          .setMeta(PAGINATION_INTERNAL_META, true),
      )
    }
    const surfaceHeight =
      result.pages.length * pageHeight + Math.max(0, result.pages.length - 1) * pageGap
    surface.style.minHeight = `${surfaceHeight}px`
    const currentPage = computeCurrentPage(
      surface.getBoundingClientRect(),
      pageHeight,
      pageGap,
      result.pages.length,
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
    // applyPagination() measures every top-level block (getComputedStyle,
    // offsetTop, getBoundingClientRect, posAtDOM) — cheap for a few dozen
    // blocks, but on a 150-200 page document that's over a thousand forced
    // layout reads. The previous single requestAnimationFrame debounce only
    // coalesces calls scheduled within the same frame; once a recompute
    // itself takes longer than one frame (as it does at that size), each
    // keystroke's rAF runs serially instead of batching, and typing became
    // audibly laggy. Debouncing by a short idle delay first means a fast
    // typing burst schedules exactly one recompute after it pauses, not one
    // per keystroke — pagination still updates well within human-perceptible
    // time, it just no longer fights every keystroke for the same frame.
    //
    // Bounded by a max wait: a sustained burst of transactions denser than
    // 120ms apart (rapid typing, a large paste settling) would otherwise
    // defer the debounce forever. Forcing a run once 500ms have passed since
    // the first request in the current burst guarantees pagination still
    // gets applied periodically during a long burst, not just once it fully
    // stops.
    const now = Date.now()
    if (paginationScheduledAt === null) paginationScheduledAt = now
    const overdue = now - paginationScheduledAt >= 500
    if (paginationTimeout !== null) clearTimeout(paginationTimeout)
    paginationTimeout = setTimeout(() => {
      paginationTimeout = null
      paginationScheduledAt = null
      if (paginationFrame !== null) cancelAnimationFrame(paginationFrame)
      paginationFrame = requestAnimationFrame(() => applyPagination())
    }, overdue ? 0 : 120)
  }

  editor.on('transaction', ({ transaction }) => {
    if (transaction.getMeta(PAGINATION_INTERNAL_META)) return
    if (
      dictationRange !== null &&
      !transaction.getMeta(DICTATION_INTERNAL_META) &&
      (transaction.docChanged || transaction.selectionSet)
    ) {
      const { from, to } = transaction.selection
      const staysInRange = from >= dictationRange.from && to <= dictationRange.to
      if (!staysInRange) dictationRange = null
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
    if (scrollListenerAttached) window.removeEventListener('scroll', handleScroll)
    if (scrollFrame !== null) cancelAnimationFrame(scrollFrame)
    if (paginationFrame !== null) cancelAnimationFrame(paginationFrame)
    if (paginationTimeout !== null) clearTimeout(paginationTimeout)
    editor.unregisterPlugin(paginationOffsetPluginKey)
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
      .scrollIntoView()
      .run()
  }

  const updateDictation = ({ text, isFinal, target, selection }: EditorDictationUpdate): boolean => {
    if (dictationRange === null) {
      if (target === 'selection') {
        if (!selection) return false
        const currentText = editor.state.doc.textBetween(selection.from, selection.to, '\n')
        if (currentText !== selection.text) return false
        dictationRange = { from: selection.from, to: selection.to }
      } else if (target === 'end') {
        const isEmptyParagraph =
          editor.state.doc.childCount === 1 &&
          editor.state.doc.firstChild?.type.name === 'paragraph' &&
          editor.state.doc.firstChild.content.size === 0
        const end = editor.state.doc.content.size
        dictationRange = isEmptyParagraph ? { from: 0, to: end } : { from: end, to: end }
      } else {
        const head = editor.state.selection.head
        dictationRange = { from: head, to: head }
      }
    }

    const { from, to } = dictationRange
    const tagInternal = ({ tr }: { tr: typeof editor.state.tr }) => {
      tr.setMeta(DICTATION_INTERNAL_META, true)
      return true
    }
    // A plain, normal (fully undoable) transaction either way — no
    // addToHistory suppression. ProseMirror's own history plugin groups
    // transactions dispatched within its default newGroupDelay into one
    // undo step, the same mechanism that makes fast typing a single undo —
    // that's what keeps a whole rapid utterance to one undo, not a custom
    // scheme layered on top of it. An earlier attempt at live dictation used
    // addToHistory:false for interim ticks and corrupted undo history: the
    // very first tick's replacement of the pre-dictation content was itself
    // marked non-undoable, so undo could never restore it.
    const didRun = text
      ? editor.chain().focus().command(tagInternal)
          .insertContentAt({ from, to }, { type: 'text', text })
          .run()
      : editor.chain().focus().command(tagInternal)
          .deleteRange({ from, to })
          .run()

    if (!didRun) {
      if (isFinal) dictationRange = null
      return false
    }

    dictationRange = isFinal ? null : { from, to: editor.state.selection.to }
    return true
  }

  const insertAsset = (
    asset: EditorAssetInsertion,
    target: EditorStructuredInsertion['target'] = 'cursor',
  ): boolean => {
    if (!asset.assetId || !asset.title || !asset.renderer) return false
    const content = {
      type: 'enterpriseAsset',
      attrs: { ...asset, instanceId: crypto.randomUUID() },
    }
    if (target === 'selection' && !editor.state.selection.empty) {
      return editor.chain().focus().insertContentAt(
        { from: editor.state.selection.from, to: editor.state.selection.to },
        content,
      ).run()
    }
    if (target === 'end') {
      return editor.chain().focus().insertContentAt(editor.state.doc.content.size, content).run()
    }
    return editor.chain().focus().insertContent(content).run()
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
    setHighlightColor: (color) => {
      if (color) editor.chain().focus().setHighlight({ color }).run()
      else editor.chain().focus().unsetHighlight().run()
    },
    getHighlightColor: () => (editor.getAttributes('highlight').color as string | undefined) ?? null,
    toggleSuperscript: () => {
      editor.chain().focus().toggleSuperscript().run()
    },
    isSuperscript: () => editor.isActive('superscript'),
    toggleSubscript: () => {
      editor.chain().focus().toggleSubscript().run()
    },
    isSubscript: () => editor.isActive('subscript'),

    setColor: (color) => {
      editor.chain().focus().setColor(color).run()
    },
    unsetColor: () => {
      editor.chain().focus().unsetColor().run()
    },
    getColor: () => (editor.getAttributes('textStyle').color as string | undefined) ?? null,
    setFontFamily: (family) => {
      editor.chain().focus().setFontFamily(family).run()
    },
    unsetFontFamily: () => {
      editor.chain().focus().unsetFontFamily().run()
    },
    getFontFamily: () => (editor.getAttributes('textStyle').fontFamily as string | undefined) ?? null,
    setFontSize: (size) => {
      editor.chain().focus().setFontSize(size).run()
    },
    unsetFontSize: () => {
      editor.chain().focus().unsetFontSize().run()
    },
    getFontSize: () => (editor.getAttributes('textStyle').fontSize as string | undefined) ?? null,

    isLink: () => editor.isActive('link'),
    getLinkHref: () => (editor.getAttributes('link').href as string | undefined) ?? null,
    setLink: (href) => {
      const trimmed = href.trim()
      if (!trimmed) return false
      return editor.chain().focus().extendMarkRange('link').setLink({ href: normalizeLinkHref(trimmed) }).run()
    },
    unsetLink: () => editor.chain().focus().extendMarkRange('link').unsetLink().run(),

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

    isTable: () => editor.isActive('table'),
    addColumnBefore: () => {
      editor.chain().focus().addColumnBefore().run()
    },
    addColumnAfter: () => {
      editor.chain().focus().addColumnAfter().run()
    },
    deleteColumn: () => {
      editor.chain().focus().deleteColumn().run()
    },
    addRowBefore: () => {
      editor.chain().focus().addRowBefore().run()
    },
    addRowAfter: () => {
      editor.chain().focus().addRowAfter().run()
    },
    deleteRow: () => {
      editor.chain().focus().deleteRow().run()
    },
    deleteTable: () => {
      editor.chain().focus().deleteTable().run()
    },
    mergeOrSplitCell: () => {
      editor.chain().focus().mergeOrSplit().run()
    },
    toggleHeaderRow: () => {
      editor.chain().focus().toggleHeaderRow().run()
    },
    toggleHeaderColumn: () => {
      editor.chain().focus().toggleHeaderColumn().run()
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
            // A form-feed marker Print Preview's plain-text pagination
            // (`paginateText`) reads back as a forced page boundary — see
            // MANUAL_PAGE_BREAK_MARKER in paginationEngine.ts. Print Preview
            // otherwise has no way to know a manual break exists at all,
            // since it works from plain text, not the document tree.
            pageBreak: () => '\f',
          },
        })
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim(),
    getDocumentSnapshot: () => structuredClone(editor.getJSON()) as EditorDocumentNode,
    replaceDocumentSnapshot: (snapshot, options) => editor
      .chain()
      .command(({ tr }) => {
        if (options?.origin === 'remote') {
          tr.setMeta(REMOTE_DOCUMENT_META, true)
          // A remote peer's whole-document sync must never land on the
          // local undo stack — otherwise a local Ctrl+Z after a remote edit
          // arrives undoes the peer's document instead of the local user's
          // own last change. Local uses of replaceDocumentSnapshot (version
          // restore, "New Document", "Open") are unaffected — they don't
          // pass `origin: 'remote'` and remain undoable, matching the
          // existing local-content-replacement behavior in each of those
          // call sites.
          tr.setMeta('addToHistory', false)
        }
        return true
      })
      .setContent(snapshot, { emitUpdate: true, errorOnInvalidContent: true })
      .run(),
    insertStructuredContent,
    updateDictation,
    insertAsset,
    insertTable: (rows = 3, columns = 3) => editor
      .chain()
      .focus()
      .insertTable({
        rows: Math.min(10, Math.max(1, Math.round(rows))),
        cols: Math.min(10, Math.max(1, Math.round(columns))),
        withHeaderRow: true,
      })
      .run(),
    insertParagraph: () => editor.chain().focus().splitBlock().run(),
    replaceTextOccurrences: (search, replacement) => {
      if (!search || search === replacement) return 0
      const ranges: Array<{ from: number; to: number }> = []
      editor.state.doc.descendants((node, position) => {
        if (!node.isText || !node.text) return
        let offset = node.text.indexOf(search)
        while (offset >= 0) {
          ranges.push({ from: position + offset, to: position + offset + search.length })
          offset = node.text.indexOf(search, offset + search.length)
        }
      })
      if (ranges.length === 0) return 0
      const transaction = editor.state.tr
      for (const range of ranges.toReversed()) {
        transaction.insertText(replacement, range.from, range.to)
      }
      editor.view.dispatch(transaction)
      return ranges.length
    },
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
      if (!scrollListenerAttached) {
        window.addEventListener('scroll', handleScroll, { passive: true })
        scrollListenerAttached = true
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
      if (getManualPageBreaks().some((pageBreak) => Math.abs(pageBreak.position - position) <= 1)) {
        return false
      }
      const inserted = editor
        .chain()
        .focus()
        .insertContentAt(position, { type: 'pageBreak', attrs: { id: crypto.randomUUID() } })
        .run()
      if (inserted) schedulePagination()
      return inserted
    },
    removePageBreak: (pageBreakId) => {
      const target = getManualPageBreaks().find((pageBreak) => pageBreak.id === pageBreakId)
      if (!target) return false
      const node = editor.state.doc.nodeAt(target.position)
      if (!node) return false
      const removed = editor
        .chain()
        .focus()
        .deleteRange({ from: target.position, to: target.position + node.nodeSize })
        .run()
      if (removed) schedulePagination()
      return removed
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
