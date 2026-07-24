import { useEffect, useRef } from 'react'
import type { MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { FileText, X } from 'lucide-react'
import {
  formatKnowledgeSourceSize,
  getKnowledgeSourceLabel,
  type KnowledgeSource,
} from '../types/source'
import { PDFPreview } from './PDFPreview'
import { PreviewLoading } from './PreviewLoading'
import { TextPreview } from './TextPreview'

interface DocumentPreviewProps {
  source: KnowledgeSource | null
  onClose: () => void
}

export function DocumentPreview({ source, onClose }: DocumentPreviewProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!source) return

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )
      const first = focusable[0]
      const last = focusable.at(-1)
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
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [onClose, source])

  if (!source) return null

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose()
  }
  const pageLabel = source.pageCount
    ? `${source.pageCount} ${source.pageCount === 1 ? 'page' : 'pages'}`
    : null

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-neutral-950/35 p-0 backdrop-blur-[2px] [animation:knowledge-dialog-in_160ms_ease-out] sm:p-4"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-preview-title"
        className="flex h-full w-full flex-col overflow-hidden bg-neutral-100 outline-none sm:h-[calc(100vh-2rem)] sm:max-w-6xl sm:rounded-lg sm:border sm:border-neutral-300 sm:shadow-[0_30px_90px_-35px_rgba(20,20,20,0.65)]"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-neutral-200 bg-white px-4 py-3 sm:px-5">
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
                {[getKnowledgeSourceLabel(source.type), pageLabel, formatKnowledgeSourceSize(source.size)]
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
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {source.parseStatus !== 'ready' ? (
            <PreviewLoading />
          ) : source.type === 'pdf' && source.file ? (
            <PDFPreview file={source.file} />
          ) : (
            <TextPreview content={source.parsedContent ?? ''} html={source.previewHtml} />
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
