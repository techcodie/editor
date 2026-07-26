import type {
  Comment,
  CommentAuthor,
  CommentStatus,
  Reply,
} from '../types/comment'
import type { EditorTextSelection } from '../../lib/editor-api'

export function createComment(
  selection: EditorTextSelection,
  text: string,
  author: CommentAuthor,
): Comment {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    author,
    createdAt: now,
    updatedAt: now,
    status: 'active',
    resolved: false,
    text: text.trim(),
    anchor: {
      from: selection.from,
      to: selection.to,
      quote: selection.text,
    },
    replies: [],
  }
}

export function createReply(text: string, author: CommentAuthor): Reply {
  return {
    id: crypto.randomUUID(),
    author,
    text: text.trim(),
    createdAt: Date.now(),
  }
}

export function updateCommentText(comment: Comment, text: string): Comment {
  return { ...comment, text: text.trim(), updatedAt: Date.now() }
}

export function updateCommentStatus(
  comment: Comment,
  status: CommentStatus,
): Comment {
  return {
    ...comment,
    status,
    resolved: status === 'resolved',
    updatedAt: Date.now(),
  }
}

export function appendReply(comment: Comment, reply: Reply): Comment {
  return {
    ...comment,
    replies: [...comment.replies, reply],
    updatedAt: reply.createdAt,
  }
}
