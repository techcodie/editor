import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface PaginationOffsetEntry {
  /** The pure pagination push amount at this block, before its natural CSS margin-top. */
  pushPx: number
  /** The full inline `margin-top` applied to the block (natural margin + push). */
  marginTopPx: number
  pageBreakBefore: 'manual' | 'automatic'
}

export type PaginationOffsetMap = Map<number, PaginationOffsetEntry>

export interface PaginationOffsetPluginState {
  offsets: PaginationOffsetMap
  decorations: DecorationSet
}

export const paginationOffsetPluginKey = new PluginKey<PaginationOffsetPluginState>(
  'paginationOffset',
)

function buildDecorations(doc: ProseMirrorNode, offsets: PaginationOffsetMap) {
  return DecorationSet.create(
    doc,
    [...offsets].flatMap(([position, entry]) => {
      const node = doc.nodeAt(position)
      if (!node) return []
      return [
        Decoration.node(position, position + node.nodeSize, {
          style: `margin-top: ${entry.marginTopPx}px`,
          'data-page-break-before': entry.pageBreakBefore,
        }),
      ]
    }),
  )
}

/**
 * Applies pagination's per-block margin-top push as ProseMirror decorations
 * instead of `create-editor-api.ts` writing `element.style.marginTop`
 * directly to live DOM nodes. Direct writes are silently lost whenever
 * ProseMirror redraws a block for any reason other than the transaction that
 * wrote them — including redraws triggered by ProseMirror's own DOM-mutation
 * recovery for changes it did not originate itself (observed even during
 * plain typing, with no large paste or table involved). One concrete,
 * confirmed trigger: the editor's `spellcheck: 'true'` attribute
 * (`useDocumentEditor.ts`) — the browser asynchronously mutates contenteditable
 * DOM after a typing pause to apply spellcheck markup, which ProseMirror
 * observes and reconciles by redrawing the affected block from scratch,
 * discarding any inline style that wasn't part of its own model. Decorations
 * are recomputed by ProseMirror from this plugin's state on every redraw
 * regardless of what triggered it, so the pagination push can never be
 * dropped — this is self-healing by construction, not by polling.
 */
export function createPaginationOffsetPlugin() {
  return new Plugin<PaginationOffsetPluginState>({
    key: paginationOffsetPluginKey,
    state: {
      init: () => ({
        offsets: new Map(),
        decorations: DecorationSet.empty,
      }),
      apply(tr, previous) {
        const nextOffsets = tr.getMeta(paginationOffsetPluginKey) as PaginationOffsetMap | undefined
        if (nextOffsets) {
          return { offsets: nextOffsets, decorations: buildDecorations(tr.doc, nextOffsets) }
        }
        if (!tr.docChanged) return previous
        return { offsets: previous.offsets, decorations: previous.decorations.map(tr.mapping, tr.doc) }
      },
    },
    props: {
      decorations(state) {
        return paginationOffsetPluginKey.getState(state)?.decorations
      },
    },
  })
}

export function paginationOffsetMapsEqual(left: PaginationOffsetMap, right: PaginationOffsetMap): boolean {
  if (left.size !== right.size) return false
  for (const [position, entry] of left) {
    const other = right.get(position)
    if (!other || other.marginTopPx !== entry.marginTopPx || other.pageBreakBefore !== entry.pageBreakBefore) {
      return false
    }
  }
  return true
}
