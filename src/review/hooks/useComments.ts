import { useCallback, useMemo, useState } from 'react'
import type { EditorApi, EditorTextSelection } from '../../lib/editor-api'
import {
  appendReply,
  createComment,
  createReply,
  updateCommentStatus,
  updateCommentText,
} from '../services/commentRegistry'
import type { Comment, CommentAuthor } from '../types/comment'

const DEFAULT_AUTHOR: CommentAuthor = { id: 'current-user', name: 'You' }

export function useComments(
  api: EditorApi | null,
  currentAuthor: CommentAuthor = DEFAULT_AUTHOR,
) {
  const [comments, setComments] = useState<Comment[]>([])
  const [removedComments, setRemovedComments] = useState<Record<string, number>>({})

  const addComment = useCallback(
    (selection: EditorTextSelection, text: string): Comment | null => {
      if (!api || !text.trim()) return null
      const comment = createComment(selection, text, currentAuthor)
      if (!api.addCommentAnchor(selection, comment.id)) return null
      setComments((current) => [comment, ...current])
      return comment
    },
    [api, currentAuthor],
  )

  const addReply = useCallback(
    (commentId: string, text: string): boolean => {
      if (!text.trim()) return false
      if (!comments.some((comment) => comment.id === commentId)) return false
      const reply = createReply(text, currentAuthor)
      setComments((current) =>
        current.map((comment) => {
          if (comment.id !== commentId) return comment
          return appendReply(comment, reply)
        }),
      )
      return true
    },
    [comments, currentAuthor],
  )

  const editComment = useCallback(
    (commentId: string, text: string): boolean => {
      if (!text.trim()) return false
      const canEdit = comments.some(
        (comment) =>
          comment.id === commentId && comment.author.id === currentAuthor.id,
      )
      if (!canEdit) return false
      setComments((current) =>
        current.map((comment) => {
          if (comment.id !== commentId || comment.author.id !== currentAuthor.id) {
            return comment
          }
          return updateCommentText(comment, text)
        }),
      )
      return true
    },
    [comments, currentAuthor.id],
  )

  const setResolved = useCallback((commentId: string, resolved: boolean) => {
    setComments((current) =>
      current.map((comment) =>
        comment.id === commentId
          ? updateCommentStatus(comment, resolved ? 'resolved' : 'active')
          : comment,
      ),
    )
  }, [])

  const deleteComment = useCallback(
    (commentId: string): boolean => {
      const comment = comments.find((item) => item.id === commentId)
      if (!comment || comment.author.id !== currentAuthor.id) return false
      api?.removeCommentAnchor(commentId)
      setComments((current) => current.filter((item) => item.id !== commentId))
      setRemovedComments((current) => ({ ...current, [commentId]: Date.now() }))
      return true
    },
    [api, comments, currentAuthor.id],
  )

  const jumpToComment = useCallback(
    (commentId: string) => api?.focusCommentAnchor(commentId) ?? false,
    [api],
  )

  const commentsById = useMemo(
    () => new Map(comments.map((comment) => [comment.id, comment])),
    [comments],
  )

  const applyRemoteComments = useCallback((
    next: Comment[],
    nextRemovedComments: Record<string, number>,
  ) => {
    setRemovedComments(structuredClone(nextRemovedComments))
    setComments(structuredClone(next).filter(
      (comment) => comment.updatedAt > (nextRemovedComments[comment.id] ?? 0),
    ))
  }, [])

  return {
    comments,
    removedComments,
    commentsById,
    currentAuthor,
    addComment,
    addReply,
    editComment,
    setResolved,
    deleteComment,
    jumpToComment,
    applyRemoteComments,
  }
}
