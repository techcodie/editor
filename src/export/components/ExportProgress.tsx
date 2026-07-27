import { CheckCircle2, LoaderCircle, XCircle } from 'lucide-react'
import type { ExportJob, ExportStatus } from '../types/export'

interface ExportProgressProps {
  job: ExportJob
}

const STATUS_LABELS: Record<ExportStatus, string> = {
  queued: 'Queued',
  rendering: 'Rendering document',
  generating: 'Generating file',
  finalizing: 'Finalizing download',
  completed: 'Export completed',
  failed: 'Export failed',
}

export function ExportProgress({ job }: ExportProgressProps) {
  const failed = job.status === 'failed'
  const completed = job.status === 'completed'
  return (
    <div
      className="rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/70"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        {failed ? (
          <XCircle size={15} className="text-red-600" aria-hidden />
        ) : completed ? (
          <CheckCircle2 size={15} className="text-emerald-600" aria-hidden />
        ) : (
          <LoaderCircle size={15} className="animate-spin text-indigo-600" aria-hidden />
        )}
        <span className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">
          {STATUS_LABELS[job.status]}
        </span>
        <span className="ml-auto text-[10px] tabular-nums text-neutral-500">
          {job.progress}%
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${failed ? 'bg-red-500' : completed ? 'bg-emerald-500' : 'bg-indigo-600'}`}
          style={{ width: `${job.progress}%` }}
        />
      </div>
      {job.error && <p className="mt-2 text-[10px] text-red-600">{job.error}</p>}
    </div>
  )
}
