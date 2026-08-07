import { ChevronDown, ChevronUp } from 'lucide-react'

interface ChangeNavigatorProps {
  currentIndex: number
  total: number
  onPrevious: () => void
  onNext: () => void
}
export function ChangeNavigator({
  currentIndex,
  total,
  onPrevious,
  onNext,
}: ChangeNavigatorProps) {
  return (
    <div className="flex items-center gap-1" aria-label="Suggestion navigation">
      <span className="mr-1 min-w-12 text-right text-[10px] tabular-nums text-neutral-400">
        {total === 0 ? '0 of 0' : `${Math.max(currentIndex + 1, 0)} of ${total}`}
      </span>
      <button
        type="button"
        onClick={onPrevious}
        disabled={total === 0 || currentIndex <= 0}
        aria-label="Previous suggestion"
        title="Previous suggestion"
        className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronUp size={15} strokeWidth={2} aria-hidden />
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={total === 0 || currentIndex >= total - 1}
        aria-label="Next suggestion"
        title="Next suggestion"
        className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronDown size={15} strokeWidth={2} aria-hidden />
      </button>
    </div>
  )
}
