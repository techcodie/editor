import type { CSSProperties } from 'react'
import { MessageSquarePlus } from 'lucide-react'
import type { EditorSelectionBounds } from '../../lib/editor-api'
import { CommentComposer } from './CommentComposer'

interface SelectionCommentComposerProps {
  bounds: EditorSelectionBounds
  quote: string
  onSubmit: (text: string) => boolean
  onCancel: () => void
}

interface ComposerPosition extends CSSProperties {
  '--review-composer-left': string
  '--review-composer-top': string
}

export function SelectionCommentComposer({
  bounds,
  quote,
  onSubmit,
  onCancel,
}: SelectionCommentComposerProps) {
  const center = (bounds.left + bounds.right) / 2
  const left = Math.min(Math.max(center, 154), window.innerWidth - 154)
  const style: ComposerPosition = {
    '--review-composer-left': `${left}px`,
    '--review-composer-top': `${bounds.bottom + 10}px`,
  }

  return (
    <section
      aria-label="New comment"
      style={style}
      className="fixed left-[var(--review-composer-left)] top-[var(--review-composer-top)] z-50 w-[19rem] -translate-x-1/2 [animation:selection-ai-in_150ms_ease-out] max-sm:bottom-3 max-sm:left-3 max-sm:right-3 max-sm:top-auto max-sm:w-auto max-sm:translate-x-0"
    >
      <div className="mb-1.5 flex items-center gap-2 rounded-md border border-neutral-200 bg-white/95 px-2.5 py-1.5 text-[11px] text-neutral-500 shadow-sm backdrop-blur-sm">
        <MessageSquarePlus size={13} strokeWidth={1.9} className="shrink-0" aria-hidden />
        <span className="truncate">“{quote}”</span>
      </div>
      <CommentComposer onSubmit={onSubmit} onCancel={onCancel} />
    </section>
  )
}
