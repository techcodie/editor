import { X } from 'lucide-react'
import type { PageBreak } from '../types/page'

interface PageBreakIndicatorProps {
  pageBreak: PageBreak
  onRemove: (pageBreakId: string) => void
}

export function PageBreakIndicator({ pageBreak, onRemove }: PageBreakIndicatorProps) {
  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-20 flex -translate-y-1/2 items-center gap-2"
      style={{ top: pageBreak.top }}
      aria-hidden={!pageBreak.manual}
    >
      <span className="h-px flex-1 bg-neutral-300" />
      <span className="rounded bg-[#f6f6f4] px-2 text-[9px] font-semibold uppercase text-neutral-400">
        {pageBreak.manual ? 'Manual page break' : 'Page break'}
      </span>
      {pageBreak.manual && (
        <button
          type="button"
          onClick={() => onRemove(pageBreak.id)}
          aria-label="Remove manual page break"
          className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-md bg-white text-neutral-500 shadow-sm transition-colors hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
        >
          <X size={12} aria-hidden />
        </button>
      )}
      <span className="h-px flex-1 bg-neutral-300" />
    </div>
  )
}
