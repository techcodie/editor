import { Share2 } from 'lucide-react'

interface ShareToolbarControlProps {
  isOpen: boolean
  onToggle: () => void
}

export function ShareToolbarControl({ isOpen, onToggle }: ShareToolbarControlProps) {
  return (
    <button
      id="form-share-trigger"
      type="button"
      onClick={onToggle}
      aria-label={isOpen ? 'Close form sharing' : 'Share HTML form'}
      aria-expanded={isOpen}
      aria-controls="form-share-dialog"
      title="Share HTML form"
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-white/95 shadow-[var(--document-editor-shadow-surface)] transition-[border-color,background-color,color,transform] hover:-translate-y-px hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 ${isOpen ? 'border-neutral-800 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-500 hover:text-neutral-950'}`}
    >
      <Share2 size={17} strokeWidth={1.9} aria-hidden />
    </button>
  )
}
