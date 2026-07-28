import { LoaderCircle, X } from 'lucide-react'
import type { WritingAnalysisProgress } from '../types/writing'

export function AnalysisProgress({ progress, onCancel }: { progress: WritingAnalysisProgress; onCancel: () => void }) {
  return (
    <div className="shrink-0 border-b border-violet-100 bg-violet-50/70 px-4 py-3 dark:border-violet-950 dark:bg-violet-950/20" role="status" aria-live="polite">
      <div className="flex items-center gap-2.5">
        <LoaderCircle size={15} className="shrink-0 animate-spin text-violet-700 dark:text-violet-300" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 text-[10px] font-medium text-violet-950 dark:text-violet-100">
            <span className="truncate">{progress.message}</span>
            <span className="tabular-nums">{progress.progress}%</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-950">
            <div className="h-full rounded-full bg-violet-600 transition-[width] duration-200" style={{ width: `${progress.progress}%` }} />
          </div>
        </div>
        <button type="button" onClick={onCancel} aria-label="Cancel writing analysis" className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-violet-600 hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:hover:bg-violet-900">
          <X size={13} aria-hidden />
        </button>
      </div>
    </div>
  )
}
