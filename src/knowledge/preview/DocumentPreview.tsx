import { lazy, Suspense, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { FileInput, FileText, MessageSquareText, Sparkles, X } from 'lucide-react'
import {
  formatKnowledgeSourceSize,
  getKnowledgeSourceLabel,
  type KnowledgeSource,
} from '../types/source'
import { PreviewLoading } from './PreviewLoading'
import { TextPreview } from './TextPreview'

const PDFPreview = lazy(async () => {
  const module = await import('./PDFPreview')
  return { default: module.PDFPreview }
})

interface DocumentPreviewProps {
  source: KnowledgeSource | null
  focusVersion: number
  onAskAi: (source: KnowledgeSource) => void
  onClose: () => void
}

export function DocumentPreview({
  source,
  focusVersion,
  onAskAi,
  onClose,
}: DocumentPreviewProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const sourceId = source?.id

  useEffect(() => {
    if (!sourceId) return

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [onClose, sourceId])

  useEffect(() => {
    if (sourceId) contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [focusVersion, sourceId])

  if (!source) return null

  const pageLabel = source.pageCount
    ? `${source.pageCount} ${source.pageCount === 1 ? 'page' : 'pages'}`
    : null

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[52vh] [animation:knowledge-dialog-in_160ms_ease-out] md:inset-y-4 md:left-4 md:right-[25rem] md:h-auto">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="document-preview-title"
        className="pointer-events-auto flex h-full w-full flex-col overflow-hidden border-b border-neutral-300 bg-neutral-100 shadow-[0_24px_60px_-30px_rgba(20,20,20,0.6)] outline-none md:rounded-lg md:border"
      >
        <header className="shrink-0 border-b border-neutral-200 bg-white">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200"
                aria-hidden
              >
                <FileText size={18} strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <h2
                  id="document-preview-title"
                  className="truncate text-sm font-semibold text-neutral-950"
                >
                  {source.name}
                </h2>
                <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                  {[
                    getKnowledgeSourceLabel(source.type),
                    pageLabel,
                    formatKnowledgeSourceSize(source.size),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close document preview"
              title="Close preview"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
            >
              <X size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>
          <div
            className="flex items-center gap-1 overflow-x-auto border-t border-neutral-100 px-4 py-2 sm:px-5"
            aria-label="Preview actions"
          >
            <button
              type="button"
              onClick={() => onAskAi(source)}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-neutral-900 px-2.5 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-2"
            >
              <MessageSquareText size={13} strokeWidth={1.9} aria-hidden />
              Ask AI
            </button>
            <button
              type="button"
              disabled
              title="Summarize will be available in a future milestone"
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium text-neutral-400 disabled:cursor-not-allowed"
            >
              <Sparkles size={13} strokeWidth={1.9} aria-hidden />
              Summarize
            </button>
            <button
              type="button"
              disabled
              title="Insert will be available in a future milestone"
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium text-neutral-400 disabled:cursor-not-allowed"
            >
              <FileInput size={13} strokeWidth={1.9} aria-hidden />
              Insert
            </button>
          </div>
        </header>

        <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {source.parseStatus !== 'ready' ? (
            <PreviewLoading />
          ) : source.type === 'pdf' && source.file ? (
            <Suspense fallback={<PreviewLoading />}>
              <PDFPreview file={source.file} />
            </Suspense>
          ) : (
            <TextPreview content={source.parsedContent ?? ''} html={source.previewHtml} />
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
