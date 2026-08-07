import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { TrackChange } from '../../review/trackChanges/types/trackChange'

interface ComparisonNavigatorProps {
  changes: TrackChange[]
  selectedChangeId: string | null
  onSelect: (changeId: string) => void
  onPrevious: () => void
  onNext: () => void
}

const MARKER_STYLES = {
  insert: 'bg-emerald-500',
  delete: 'bg-red-500',
  replace: 'bg-amber-500',
  format: 'bg-blue-500',
} as const

export function ComparisonNavigator({
  changes,
  selectedChangeId,
  onSelect,
  onPrevious,
  onNext,
}: ComparisonNavigatorProps) {
  const currentIndex = changes.findIndex((change) => change.id === selectedChangeId)
  return (
    <div className="flex items-center gap-2">
      <div className="relative hidden h-6 w-24 overflow-hidden rounded border border-neutral-200 bg-white sm:block" aria-label="Change overview">
        {changes.map((change, index) => (
          <button
            key={change.id}
            type="button"
            onClick={() => onSelect(change.id)}
            aria-label={`Change ${index + 1}`}
            className={cn(
              'absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded-full transition-[height,opacity] hover:h-4 focus-visible:h-4 focus-visible:outline-none',
              MARKER_STYLES[change.type],
              change.id === selectedChangeId ? 'h-4 opacity-100' : 'opacity-55',
            )}
            style={{ left: `${changes.length <= 1 ? 50 : (index / (changes.length - 1)) * 94 + 3}%` }}
          />
        ))}
      </div>
      <span className="min-w-12 text-right text-[10px] tabular-nums text-neutral-500">
        {changes.length === 0 ? '0 of 0' : `${Math.max(currentIndex + 1, 1)} of ${changes.length}`}
      </span>
      <button
        type="button"
        onClick={onPrevious}
        disabled={changes.length === 0 || currentIndex <= 0}
        aria-label="Previous change"
        className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronUp size={15} strokeWidth={2} aria-hidden />
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={changes.length === 0 || currentIndex >= changes.length - 1}
        aria-label="Next change"
        className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronDown size={15} strokeWidth={2} aria-hidden />
      </button>
    </div>
  )
}
