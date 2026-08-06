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
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-[background-color,color,transform] hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 ${isOpen ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-950'}`}
    >
      <Share2 size={16} strokeWidth={1.9} aria-hidden />
    </button>
  )
}
