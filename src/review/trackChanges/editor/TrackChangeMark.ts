import { Mark, mergeAttributes } from '@tiptap/core'
import type { Node as ProseMirrorNode, Slice } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type {
  EditorTrackChangeDraft,
  EditorTrackChangeType,
} from '../../../lib/editor-api'

export const TRACK_CHANGES_INTERNAL_META = 'trackChangesInternal'

export type TrackChangeSegment = 'insertion' | 'deletion' | 'format'

export interface TrackChangeFormatSnapshot {
  before: Slice
}

export interface TrackChangesStorage {
  enabled: boolean
  listeners: Set<(change: EditorTrackChangeDraft) => void>
  formatSnapshots: Map<string, TrackChangeFormatSnapshot>
}

function textBetween(doc: ProseMirrorNode, from: number, to: number): string {
  return from < to ? doc.textBetween(from, to, '\n').trim() : ''
}

function describeRange(doc: ProseMirrorNode, from: number, to: number): string {
  const labels = new Set<string>()
  doc.nodesBetween(from, to, (node) => {
    if (node.isTextblock) labels.add(node.type.name)
    for (const mark of node.marks) {
      if (mark.type.name !== 'trackChange' && mark.type.name !== 'reviewComment') {
        labels.add(mark.type.name)
      }
    }
  })
  return labels.size > 0 ? [...labels].join(', ') : 'Plain text'
}

function adjacentChangeId(
  doc: ProseMirrorNode,
  position: number,
  type: EditorTrackChangeType,
  segment: TrackChangeSegment,
): string | null {
  const resolved = doc.resolve(Math.max(position, 0))
  const mark = [resolved.nodeBefore, resolved.nodeAfter]
    .flatMap((node) => node?.marks ?? [])
    .find(
      (item) =>
        item.type.name === 'trackChange' &&
        item.attrs.changeType === type &&
        item.attrs.segment === segment,
    )
  return mark ? String(mark.attrs.changeId || '') || null : null
}

function findChangeRange(
  doc: ProseMirrorNode,
  changeId: string,
): { from: number; to: number } | null {
  let from: number | null = null
  let to: number | null = null
  doc.descendants((node, position) => {
    if (!node.isText) return
    const hasChange = node.marks.some(
      (mark) =>
        mark.type.name === 'trackChange' &&
        String(mark.attrs.changeId) === changeId,
    )
    if (!hasChange) return
    from = from === null ? position : Math.min(from, position)
    to = to === null ? position + node.nodeSize : Math.max(to, position + node.nodeSize)
  })
  return from !== null && to !== null ? { from, to } : null
}

export const TrackChangeMark = Mark.create<Record<string, never>, TrackChangesStorage>({
  name: 'trackChange',
  inclusive: false,

  addStorage() {
    return {
      enabled: false,
      listeners: new Set(),
      formatSnapshots: new Map(),
    }
  },

  addAttributes() {
    return {
      changeId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-change-id'),
        renderHTML: (attributes) => ({
          'data-change-id': String(attributes.changeId || ''),
        }),
      },
      changeType: {
        default: 'insert',
        parseHTML: (element) => element.getAttribute('data-change-type'),
        renderHTML: (attributes) => ({
          'data-change-type': String(attributes.changeType || 'insert'),
        }),
      },
      segment: {
        default: 'insertion',
        parseHTML: (element) => element.getAttribute('data-change-segment'),
        renderHTML: (attributes) => ({
          'data-change-segment': String(attributes.segment || 'insertion'),
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-track-change]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-track-change': '',
        title: 'Open tracked suggestion',
      }),
      0,
    ]
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('enterpriseTrackChanges'),
        appendTransaction: (transactions, oldState, newState) => {
          if (!this.storage.enabled) return null
          if (!transactions.some((transaction) => transaction.docChanged)) return null
          if (
            transactions.some((transaction) =>
              transaction.getMeta(TRACK_CHANGES_INTERNAL_META),
            )
          ) {
            return null
          }

          const from = oldState.doc.content.findDiffStart(newState.doc.content)
          const diffEnd = oldState.doc.content.findDiffEnd(newState.doc.content)
          if (from === null || !diffEnd) return null

          const oldTo = diffEnd.a
          const newTo = diffEnd.b
          const beforeText = textBetween(oldState.doc, from, oldTo)
          const afterText = textBetween(newState.doc, from, newTo)
          const isFormatting = beforeText === afterText && oldTo > from && newTo > from
          const type: EditorTrackChangeType = isFormatting
            ? 'format'
            : oldTo === from
              ? 'insert'
              : newTo === from
                ? 'delete'
                : 'replace'

          const groupedId =
            type === 'insert' || type === 'delete'
              ? adjacentChangeId(
                  newState.doc,
                  from,
                  type,
                  type === 'insert' ? 'insertion' : 'deletion',
                )
              : null
          const changeId = groupedId ?? crypto.randomUUID()
          const markType = newState.schema.marks.trackChange
          if (!markType) return null

          const transaction = newState.tr.setMeta(TRACK_CHANGES_INTERNAL_META, true)
          const mark = (changeType: EditorTrackChangeType, markSegment: TrackChangeSegment) =>
            markType.create({ changeId, changeType, segment: markSegment })

          try {
            if (type === 'insert') {
              if (newTo <= from) return null
              transaction.addMark(from, newTo, mark(type, 'insertion'))
            } else if (type === 'delete') {
              const deleted = oldState.doc.slice(from, oldTo)
              transaction.replaceRange(from, from, deleted)
              transaction.addMark(
                from,
                from + deleted.size,
                mark(type, 'deletion'),
              )
            } else if (type === 'replace') {
              const deleted = oldState.doc.slice(from, oldTo)
              const insertedSize = newTo - from
              transaction.replaceRange(from, from, deleted)
              transaction.addMark(
                from,
                from + deleted.size,
                mark(type, 'deletion'),
              )
              transaction.addMark(
                from + deleted.size,
                from + deleted.size + insertedSize,
                mark(type, 'insertion'),
              )
            } else {
              if (newTo <= from) return null
              this.storage.formatSnapshots.set(changeId, {
                before: oldState.doc.slice(from, oldTo),
              })
              transaction.addMark(from, newTo, mark(type, 'format'))
            }
          } catch {
            this.storage.formatSnapshots.delete(changeId)
            return null
          }

          const range = findChangeRange(transaction.doc, changeId) ?? {
            from,
            to: Math.max(from, newTo),
          }
          const draft: EditorTrackChangeDraft = {
            id: changeId,
            type,
            createdAt: Date.now(),
            range,
            before:
              type === 'format'
                ? describeRange(oldState.doc, from, oldTo)
                : beforeText,
            after:
              type === 'format'
                ? describeRange(newState.doc, from, newTo)
                : afterText,
          }

          queueMicrotask(() => {
            for (const listener of this.storage.listeners) listener(draft)
          })
          return transaction
        },
      }),
    ]
  },
})
