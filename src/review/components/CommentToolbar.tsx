import type { CSSProperties } from 'react'
import { MessageSquarePlus } from 'lucide-react'
import type { EditorSelectionBounds } from '../../lib/editor-api'

interface CommentToolbarProps {
  bounds: EditorSelectionBounds
  onComment: () => void
}

interface CommentToolbarStyle extends CSSProperties {
  '--review-toolbar-left': string
  '--review-toolbar-top': string
}

export function CommentToolbar({ bounds, onComment }: CommentToolbarProps) {
  const center = (bounds.left + bounds.right) / 2
  const left = Math.min(Math.max(center, 70), window.innerWidth - 70)
  const style: CommentToolbarStyle = {
    '--review-toolbar-left': `${left}px`,
    '--review-toolbar-top': `${bounds.top - 10}px`,
  }

  return (
    <div
      role="toolbar"
      aria-label="Review actions for selected text"
      style={style}
      className="fixed left-[var(--review-toolbar-left)] top-[var(--review-toolbar-top)] z-50 -translate-x-1/2 -translate-y-full rounded-lg border border-neutral-200 bg-white p-1 shadow-[var(--document-editor-shadow-overlay)] [animation:selection-ai-in_150ms_ease-out] max-sm:bottom-3 max-sm:left-3 max-sm:right-3 max-sm:top-auto max-sm:translate-x-0 max-sm:translate-y-0"
    >
      <button
        type="button"
        onClick={onComment}
        aria-keyshortcuts="Alt+Meta+M Alt+Control+M"
        className="inline-flex h-8 items-center gap-2 rounded-md bg-neutral-900 px-3 text-xs font-semibold text-white transition-[background-color,transform] hover:bg-neutral-800 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-2"
      >
        <MessageSquarePlus size={15} strokeWidth={1.9} aria-hidden />
        Comment
      </button>
    </div>
  )
}
