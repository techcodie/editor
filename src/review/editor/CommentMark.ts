import { Mark, mergeAttributes } from '@tiptap/core'

export const CommentMark = Mark.create({
  name: 'reviewComment',
  inclusive: true,

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-comment-id'),
        renderHTML: (attributes) => ({
          'data-comment-id': String(attributes.commentId || ''),
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-review-comment]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-review-comment': '',
        title: 'Open comment thread',
      }),
      0,
    ]
  },
})
