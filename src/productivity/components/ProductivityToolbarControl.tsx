import { WandSparkles } from 'lucide-react'

interface ProductivityToolbarControlProps {
  isOpen: boolean
  onToggle: () => void
}

export function ProductivityToolbarControl({ isOpen, onToggle }: ProductivityToolbarControlProps) {
  return (
    <button
      id="productivity-trigger"
      type="button"
      onClick={onToggle}
      aria-label={isOpen ? 'Close AI productivity' : 'Open AI productivity'}
      aria-expanded={isOpen}
      aria-controls="productivity-sidebar"
      title="AI productivity"
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 ${isOpen ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950'}`}
    >
      <WandSparkles size={16} strokeWidth={1.9} aria-hidden />
    </button>
  )
}
