import { LoaderCircle, Square } from 'lucide-react'
import type { ComplianceProgress } from '../types/compliance'

interface AnalysisProgressProps {
  progress: ComplianceProgress
  onCancel: () => void
}

export function AnalysisProgress({ progress, onCancel }: AnalysisProgressProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center" role="status" aria-live="polite">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
        <LoaderCircle size={20} className="animate-spin" aria-hidden />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-neutral-950">Analyzing document</h3>
      <p className="mt-1 text-xs text-neutral-500">{progress.message}</p>
      <div className="mt-5 h-1.5 w-full max-w-56 overflow-hidden rounded bg-neutral-100" aria-hidden>
        <div className="h-full rounded bg-indigo-600 transition-[width] duration-300" style={{ width: `${progress.progress}%` }} />
      </div>
      <span className="mt-2 text-[10px] tabular-nums text-neutral-400">{Math.round(progress.progress)}%</span>
      <button type="button" onClick={onCancel} className="mt-5 inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]">
        <Square size={11} fill="currentColor" aria-hidden /> Stop
      </button>
    </div>
  )
}
