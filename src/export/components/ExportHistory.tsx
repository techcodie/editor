import { Download, History, Trash2 } from 'lucide-react'
import { formatBytes } from '../services/exportManager'
import { EXPORT_FORMAT_LABELS, type ExportJob, type ExportResult } from '../types/export'

interface ExportHistoryProps {
  jobs: ExportJob[]
  onDownload: (result: ExportResult) => void
  onClear: () => void
}

export function ExportHistory({ jobs, onDownload, onClear }: ExportHistoryProps) {
  const completed = jobs.filter((job) => job.status === 'completed' && job.result)
  if (completed.length === 0) return null

  return (
    <section aria-labelledby="export-history-title">
      <div className="flex items-center">
        <h3 id="export-history-title" className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-900 dark:text-neutral-100">
          <History size={13} aria-hidden />
          Recent exports
        </h3>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear export history"
          className="ml-auto flex h-7 w-7 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          <Trash2 size={13} aria-hidden />
        </button>
      </div>
      <div className="mt-2 space-y-1.5">
        {completed.slice(0, 4).map((job) => (
          <div key={job.id} className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-2.5 py-2 dark:border-neutral-700 dark:bg-neutral-900">
            <span className="flex h-7 min-w-10 items-center justify-center rounded bg-neutral-100 px-1.5 text-[9px] font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              {EXPORT_FORMAT_LABELS[job.format]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[10px] font-medium text-neutral-700 dark:text-neutral-200">
                {job.result?.fileName}
              </span>
              <span className="block text-[9px] text-neutral-400">
                {job.result ? formatBytes(job.result.size) : ''}
              </span>
            </span>
            {job.result && (
              <button
                type="button"
                onClick={() => onDownload(job.result as ExportResult)}
                aria-label={`Download ${job.result.fileName} again`}
                className="flex h-7 w-7 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 dark:hover:bg-neutral-800 dark:hover:text-white"
              >
                <Download size={13} aria-hidden />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
