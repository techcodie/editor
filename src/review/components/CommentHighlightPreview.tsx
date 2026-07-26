import type { CSSProperties } from 'react'
import { CheckCircle2, MessageSquareText } from 'lucide-react'
import { getCommentPreview } from '../services/commentRenderer'
import type { Comment } from '../types/comment'
import type { EditorSelectionBounds } from '../../lib/editor-api'

interface CommentHighlightPreviewProps {
  comment: Comment
  bounds: EditorSelectionBounds
}

interface PreviewPosition extends CSSProperties {
  '--review-preview-left': string
  '--review-preview-top': string
}

export function CommentHighlightPreview({
  comment,
  bounds,
}: CommentHighlightPreviewProps) {
  const center = (bounds.left + bounds.right) / 2
  const left = Math.min(Math.max(center, 132), window.innerWidth - 132)
  const style: PreviewPosition = {
    '--review-preview-left': `${left}px`,
    '--review-preview-top': `${bounds.top - 8}px`,
  }

  return (
    <div
      role="tooltip"
      style={style}
      className="pointer-events-none fixed left-[var(--review-preview-left)] top-[var(--review-preview-top)] z-50 w-64 -translate-x-1/2 -translate-y-full rounded-lg border border-neutral-200 bg-white p-3 shadow-[var(--document-editor-shadow-overlay)] [animation:selection-ai-in_120ms_ease-out]"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-700">
          {comment.resolved ? (
            <CheckCircle2 size={14} strokeWidth={2} aria-hidden />
          ) : (
            <MessageSquareText size={14} strokeWidth={2} aria-hidden />
          )}
        </span>
        <span className="min-w-0 truncate text-xs font-semibold text-neutral-900">
          {comment.author.name}
        </span>
        <span className="ml-auto text-[10px] capitalize text-neutral-400">
          {comment.status}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-neutral-700">
        {getCommentPreview(comment, 150)}
      </p>
    </div>
  )
}
