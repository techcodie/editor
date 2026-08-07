import { Check, LoaderCircle, ScanText, X } from 'lucide-react'
import type { DocumentImportProgress as Progress } from '../types/documentModel'

interface ImportProgressProps {
  progress: Progress
  onCancel: () => void
}

export function ImportProgress({ progress, onCancel }: ImportProgressProps) {
  const isComplete = progress.stage === 'complete'
  return (
    <section className="mx-auto w-full max-w-xl px-5 py-12 text-center" aria-live="polite" aria-busy={!isComplete}>
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
        {isComplete ? <Check size={22} aria-hidden /> : <ScanText size={22} aria-hidden />}
      </span>
      <h3 className="mt-4 text-sm font-semibold text-neutral-950">{progress.message}</h3>
      {progress.page && progress.pageCount && (
        <p className="mt-1 text-[11px] text-neutral-500">
          Page {progress.page} of {progress.pageCount}
        </p>
      )}
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-indigo-600 transition-[width] duration-300"
          style={{ width: `${Math.max(3, progress.progress)}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-medium uppercase text-neutral-400">
        {!isComplete && <LoaderCircle size={12} className="animate-spin" aria-hidden />}
        {Math.round(progress.progress)}% complete
      </div>
      {!isComplete && (
        <button
          type="button"
          onClick={onCancel}
          className="mt-6 inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[11px] font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
        >
          <X size={13} aria-hidden />
          Cancel analysis
        </button>
      )}
    </section>
  )
}
