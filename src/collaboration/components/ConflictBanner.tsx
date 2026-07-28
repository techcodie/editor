import { GitMerge, X } from 'lucide-react'
import type { CollaborationConflict } from '../types/collaboration'

export function ConflictBanner({ conflict, onDismiss }: { conflict: CollaborationConflict | null; onDismiss(): void }) {
  if (!conflict) return null
  return (
    <div className="fixed left-1/2 top-4 z-[120] flex w-[min(34rem,calc(100%-2rem))] -translate-x-1/2 items-start gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2.5 shadow-[var(--document-editor-shadow-overlay)]" role="status">
      <GitMerge size={16} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-neutral-900">Concurrent edits reconciled</p>
        <p className="mt-0.5 text-[11px] leading-4 text-neutral-600">{conflict.message}</p>
      </div>
      <button type="button" onClick={onDismiss} aria-label="Dismiss conflict notice" className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/35"><X size={14} aria-hidden /></button>
    </div>
  )
}
