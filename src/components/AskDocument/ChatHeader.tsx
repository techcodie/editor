import { PanelRightClose, Sparkles, Trash2 } from 'lucide-react'

interface ChatHeaderProps {
  canClear: boolean
  onClear: () => void
  onClose: () => void
}
const ICON_BUTTON_CLASS =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 ' +
  'transition-[background-color,color,transform] duration-150 hover:bg-neutral-100 hover:text-neutral-950 active:scale-95 active:bg-neutral-200/70 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-1 ' +
  'disabled:pointer-events-none disabled:opacity-35'

export function ChatHeader({ canClear, onClear, onClose }: ChatHeaderProps) {
  return (
    <header className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3.5">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-white shadow-sm">
          <Sparkles size={15} strokeWidth={1.9} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id="ask-document-title" className="text-sm font-semibold text-neutral-950">
            Ask Document
          </h2>
          <p className="mt-0.5 text-xs leading-5 text-neutral-500">
            Grounded in the current document
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label="Clear conversation"
          title="Clear conversation"
          disabled={!canClear}
          onClick={onClear}
          className={ICON_BUTTON_CLASS}
        >
          <Trash2 size={16} strokeWidth={1.9} aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Close Ask Document"
          title="Close Ask Document"
          onClick={onClose}
          className={ICON_BUTTON_CLASS}
        >
          <PanelRightClose size={17} strokeWidth={1.9} aria-hidden />
        </button>
      </div>
    </header>
  )
}
