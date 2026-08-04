import { PanelRightClose, Sparkles, Trash2 } from 'lucide-react'
import { IconButton } from '../ui/IconButton'

interface ChatHeaderProps {
  canClear: boolean
  onClear: () => void
  onClose: () => void
}

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
        <IconButton icon={Trash2} label="Clear conversation" disabled={!canClear} onClick={onClear} />
        <IconButton icon={PanelRightClose} label="Close Ask Document" onClick={onClose} />
      </div>
    </header>
  )
}
