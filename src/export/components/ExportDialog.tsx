import { useEffect, useRef, useState } from 'react'
import { Download, FileDown, X } from 'lucide-react'
import type { EditorApi } from '../../lib/editor-api'
import type { PageLayout } from '../../layout/types/layout'
import type { PaginationSnapshot } from '../../layout/types/page'
import type { Comment } from '../../review/types/comment'
import type { TrackChange } from '../../review/trackChanges/types/trackChange'
import type { Watermark } from '../../watermark/types/watermark'
import type { Workflow } from '../../workflow/types/workflow'
import type { RedactionRecord } from '../../redaction/types/redaction'
import { useExport } from '../hooks/useExport'
import { formatBytes } from '../services/exportManager'
import {
  DEFAULT_EXPORT_OPTIONS,
  EXPORT_FORMAT_LABELS,
  type ExportFormat,
  type ExportOptions as ExportOptionsModel,
  type ExportRequest,
} from '../types/export'
import { ExportHistory } from './ExportHistory'
import { ExportOptions } from './ExportOptions'
import { ExportProgress } from './ExportProgress'
import { FormatSelector } from './FormatSelector'

interface ExportDialogProps {
  isOpen: boolean
  api: EditorApi | null
  layout: PageLayout
  pagination: PaginationSnapshot
  watermark: Watermark | null
  comments: Comment[]
  trackChanges: TrackChange[]
  workflow: Workflow | null
  redactions: RedactionRecord[]
  onClose: () => void
}

function documentTitle(text: string): string {
  const firstLine = text.split('\n').map((line) => line.replace(/^#+\s*/, '').trim()).find(Boolean)
  return firstLine?.slice(0, 72) || 'Untitled document'
}

export function ExportDialog({
  isOpen,
  api,
  layout,
  pagination,
  watermark,
  comments,
  trackChanges,
  workflow,
  redactions,
  onClose,
}: ExportDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [options, setOptions] = useState<ExportOptionsModel>(DEFAULT_EXPORT_OPTIONS)
  const {
    jobs,
    activeJob,
    isExporting,
    startExport,
    downloadExport,
    clearHistory,
  } = useExport()
  const createRequest = (): ExportRequest | null => {
    if (!api) return null
    const text = api.getDocumentText()
    return {
      format,
      options,
      source: {
        title: documentTitle(text),
        document: api.getDocumentSnapshot(),
        text,
        layout,
        pagination,
        watermark,
        comments,
        trackChanges,
        workflow,
        redactions,
      },
    }
  }
  const estimatedSize = Math.max(
    4_096,
    Math.round((api?.getDocumentText().length ?? 0) * (format === 'html' ? 1.25 : 0.7)),
  )
  const visibleJob = activeJob ?? jobs[0] ?? null

  useEffect(() => {
    if (!isOpen) return
    previousFocusRef.current = document.activeElement as HTMLElement | null
    window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>('[aria-label="Close export dialog"]')?.focus()
    })
    return () => previousFocusRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isExporting) {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )]
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExporting, isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/35 p-3 backdrop-blur-[2px] sm:p-6">
      <div
        ref={dialogRef}
        id="export-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-dialog-title"
        aria-describedby="export-dialog-description"
        className="flex max-h-[min(90vh,46rem)] w-full max-w-[34rem] flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white text-neutral-950 shadow-[var(--document-editor-shadow-overlay)] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
      >
        <header className="flex h-14 shrink-0 items-center border-b border-neutral-200 px-4 dark:border-neutral-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            <FileDown size={16} aria-hidden />
          </span>
          <div className="ml-3 min-w-0">
            <h2 id="export-dialog-title" className="text-sm font-semibold">Export document</h2>
            <p id="export-dialog-description" className="text-[10px] text-neutral-500 dark:text-neutral-400">
              Create a portable file from the current document
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            aria-label="Close export dialog"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            <X size={16} aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-5">
          <FormatSelector value={format} onChange={setFormat} />
          <ExportOptions
            value={options}
            commentCount={comments.length}
            trackChangeCount={trackChanges.length}
            hasWatermark={Boolean(watermark)}
            hasWorkflow={Boolean(workflow)}
            onChange={setOptions}
          />
          {visibleJob && <ExportProgress job={visibleJob} />}
          <ExportHistory jobs={jobs} onDownload={downloadExport} onClear={clearHistory} />
        </div>

        <footer className="flex shrink-0 items-center border-t border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900 sm:px-5">
          <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
            Estimated {formatBytes(estimatedSize)}
          </span>
          <button
            type="button"
            disabled={!api || isExporting}
            onClick={() => {
              const request = createRequest()
              if (request) void startExport(request)
            }}
            className="ml-auto inline-flex h-9 min-w-28 items-center justify-center gap-2 rounded-md bg-neutral-900 px-4 text-[11px] font-semibold text-white shadow-sm transition-[background-color,transform] hover:bg-neutral-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 dark:focus-visible:ring-offset-neutral-950"
          >
            <Download size={14} aria-hidden />
            {isExporting ? 'Exporting...' : `Export ${EXPORT_FORMAT_LABELS[format]}`}
          </button>
        </footer>
      </div>
    </div>
  )
}
