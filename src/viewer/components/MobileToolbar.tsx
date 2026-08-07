import { MessageSquareText, Share2, ShieldCheck, WandSparkles } from 'lucide-react'
import type { DocumentViewMode } from '../types/viewer'
import { ViewSwitcher } from './ViewSwitcher'

interface MobileToolbarProps {
  mode: DocumentViewMode
  aiEnabled: boolean
  productivityEnabled: boolean
  identityEnabled: boolean
  shareEnabled: boolean
  onModeChange: (mode: DocumentViewMode) => void
  onAskAi: () => void
  onProductivity: () => void
  onIdentity: () => void
  onShare: () => void
}

export function MobileToolbar({
  mode,
  aiEnabled,
  productivityEnabled,
  identityEnabled,
  shareEnabled,
  onModeChange,
  onAskAi,
  onProductivity,
  onIdentity,
  onShare,
}: MobileToolbarProps) {
  return (
    <nav
      aria-label="Document actions"
      className="fixed inset-x-3 bottom-3 z-40 flex h-12 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white/95 p-1.5 shadow-[var(--document-editor-shadow-overlay)] backdrop-blur-xl sm:hidden"
    >
      <ViewSwitcher mode={mode} onChange={onModeChange} compact />
      <div className="ml-auto flex items-center gap-1">
        {aiEnabled && (
          <button
            type="button"
            onClick={onAskAi}
            aria-label="Open Ask Document"
            className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
          >
            <MessageSquareText size={16} strokeWidth={1.9} aria-hidden />
          </button>
        )}
        {productivityEnabled && (
          <button
            type="button"
            onClick={onProductivity}
            aria-label="Open AI productivity"
            className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
          >
            <WandSparkles size={16} strokeWidth={1.9} aria-hidden />
          </button>
        )}
        {identityEnabled && (
          <button
            type="button"
            onClick={onIdentity}
            aria-label="Open identity settings"
            className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
          >
            <ShieldCheck size={16} strokeWidth={1.9} aria-hidden />
          </button>
        )}
        {shareEnabled && <button
          type="button"
          onClick={onShare}
          aria-label="Share HTML form"
          className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
        >
          <Share2 size={16} strokeWidth={1.9} aria-hidden />
        </button>}
      </div>
    </nav>
  )
}
