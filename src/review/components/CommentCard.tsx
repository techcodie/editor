import { memo } from 'react'
import { CheckCircle2, MessageSquareText } from 'lucide-react'
import {
  formatCommentDate,
  getCommentPreview,
} from '../services/commentRenderer'
import type { Comment } from '../types/comment'

interface CommentCardProps {
  comment: Comment
  onSelect: (commentId: string) => void
}

function CommentCardComponent({ comment, onSelect }: CommentCardProps) {
  return (
    <article className="border-b border-neutral-100 last:border-b-0">
      <button
        type="button"
        onClick={() => onSelect(comment.id)}
        className="group w-full px-4 py-3.5 text-left transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500/35"
      >
        <span className="flex items-center gap-2">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${comment.resolved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {comment.resolved ? (
              <CheckCircle2 size={14} strokeWidth={2} aria-hidden />
            ) : (
              <MessageSquareText size={14} strokeWidth={2} aria-hidden />
            )}
          </span>
          <span className="min-w-0 truncate text-xs font-semibold text-neutral-900">
            {comment.author.name}
          </span>
          <time
            dateTime={new Date(comment.createdAt).toISOString()}
            className="ml-auto shrink-0 text-[10px] text-neutral-400"
          >
            {formatCommentDate(comment.createdAt)}
          </time>
        </span>
        <span className="mt-2 block line-clamp-2 text-xs leading-5 text-neutral-700">
          {getCommentPreview(comment)}
        </span>
        <span className="mt-2 flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate rounded bg-neutral-100 px-2 py-1 text-[10px] text-neutral-500">
            “{comment.anchor.quote}”
          </span>
          {comment.replies.length > 0 && (
            <span className="shrink-0 text-[10px] tabular-nums text-neutral-400">
              {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </span>
          )}
        </span>
      </button>
    </article>
  )
}

export const CommentCard = memo(CommentCardComponent)
