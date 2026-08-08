import { mergeAttributes, Node } from '@tiptap/core'

/**
 * A manual page break, represented as a real (if visually minimal) document
 * node instead of the closure-scoped array `create-editor-api.ts` used to
 * track separately. That array was remapped through each transaction's own
 * position mapping, but insert/remove of a break itself never went through
 * `editor.chain()`, so it created no ProseMirror history entry — undoing
 * past a break's creation didn't remove it, and the insert/remove actions
 * weren't themselves undoable. Making it a node fixes that for free: both
 * actions are now ordinary transactions, so Tiptap's built-in history
 * handles them like any other edit.
 *
 * This node is deliberately just a near-zero-height marker in the document
 * flow — the visible "Manual page break" chip and its remove button are a
 * floating overlay rendered by `PageBreakIndicator`, sourced from the
 * pagination snapshot, unchanged by this node's own HTML.
 */
export const PageBreakNode = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-page-break-id'),
        renderHTML: (attributes) => ({ 'data-page-break-id': attributes.id }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-page-break]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-page-break': '', 'aria-hidden': 'true' })]
  },
})
