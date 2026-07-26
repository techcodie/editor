import { memo, useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  LocateFixed,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { CommentComposer } from './CommentComposer'
import { formatCommentDate } from '../services/commentRenderer'
import type { Comment } from '../types/comment'

interface CommentThreadProps {
  comment: Comment
  currentAuthorId: string
  onBack: () => void
  onReply: (commentId: string, text: string) => boolean
  onResolve: (commentId: string, resolved: boolean) => void
  onEdit: (commentId: string, text: string) => boolean
  onDelete: (commentId: string) => boolean
  onJump: (commentId: string) => boolean
}

function CommentThreadComponent({
  comment,
  currentAuthorId,
  onBack,
  onReply,
  onResolve,
  onEdit,
  onDelete,
  onJump,
}: CommentThreadProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isOwnComment = comment.author.id === currentAuthorId

  useEffect(() => {
    setIsEditing(false)
    setConfirmDelete(false)
  }, [comment.id])

  return (
    <section aria-labelledby={`comment-thread-${comment.id}`} className="min-h-0 overflow-y-auto overscroll-contain">
      <div className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to comments"
          className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
        >
          <ArrowLeft size={16} strokeWidth={2} aria-hidden />
        </button>
        <h3 id={`comment-thread-${comment.id}`} className="text-xs font-semibold text-neutral-900">
          Discussion
        </h3>
        <span className={`ml-auto rounded px-2 py-1 text-[10px] font-semibold capitalize ${comment.resolved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {comment.status}
        </span>
      </div>

      <div className="px-4 py-4">
        <button
          type="button"
          onClick={() => onJump(comment.id)}
          className="mb-4 block w-full rounded-md border-l-2 border-amber-400 bg-amber-50/70 px-3 py-2 text-left text-xs leading-5 text-neutral-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
        >
          “{comment.anchor.quote}”
        </button>

        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-xs font-semibold text-white">
            {comment.author.name.slice(0, 1).toLocaleUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-xs font-semibold text-neutral-900">
                {comment.author.name}
              </span>
              <time
                dateTime={new Date(comment.createdAt).toISOString()}
                className="text-[10px] text-neutral-400"
              >
                {formatCommentDate(comment.createdAt)}
              </time>
            </div>
            {isEditing ? (
              <div className="mt-2">
                <CommentComposer
                  initialText={comment.text}
                  compact
                  submitLabel="Save"
                  onCancel={() => setIsEditing(false)}
                  onSubmit={(text) => {
                    const saved = onEdit(comment.id, text)
                    if (saved) setIsEditing(false)
                    return saved
                  }}
                />
              </div>
            ) : (
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                {comment.text}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1 border-b border-neutral-100 pb-4 pl-10">
          <button
            type="button"
            onClick={() => onResolve(comment.id, !comment.resolved)}
            className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
          >
            {comment.resolved ? <RotateCcw size={13} aria-hidden /> : <CheckCircle2 size={13} aria-hidden />}
            {comment.resolved ? 'Reopen' : 'Resolve'}
          </button>
          <button
            type="button"
            onClick={() => onJump(comment.id)}
            className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
          >
            <LocateFixed size={13} aria-hidden />
            Jump
          </button>
          {isOwnComment && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
            >
              <Pencil size={13} aria-hidden />
              Edit
            </button>
          )}
          {isOwnComment && (
            confirmDelete ? (
              <span className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="h-7 rounded-md px-2 text-[11px] font-medium text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
                >
                  Keep
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDelete(comment.id)) onBack()
                  }}
                  className="h-7 rounded-md bg-red-600 px-2 text-[11px] font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                >
                  Delete
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                aria-label="Delete comment"
                title="Delete comment"
                className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/35"
              >
                <Trash2 size={13} aria-hidden />
              </button>
            )
          )}
        </div>

        {comment.replies.length > 0 && (
          <div className="divide-y divide-neutral-100">
            {comment.replies.map((reply) => (
              <article key={reply.id} className="flex gap-2.5 py-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-[11px] font-semibold text-neutral-700">
                  {reply.author.name.slice(0, 1).toLocaleUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs font-semibold text-neutral-900">
                      {reply.author.name}
                    </span>
                    <time
                      dateTime={new Date(reply.createdAt).toISOString()}
                      className="text-[10px] text-neutral-400"
                    >
                      {formatCommentDate(reply.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-neutral-700">
                    {reply.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}

        {!isEditing && (
          <div className="mt-4">
            <CommentComposer
              compact
              autoFocus={false}
              placeholder="Reply to discussion…"
              submitLabel="Reply"
              onSubmit={(text) => onReply(comment.id, text)}
            />
          </div>
        )}
      </div>
    </section>
  )
}

export const CommentThread = memo(CommentThreadComponent)
