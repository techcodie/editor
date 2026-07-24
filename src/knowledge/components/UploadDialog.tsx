import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { FileUp, Upload, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { getKnowledgeSourceType, KNOWLEDGE_SOURCE_ACCEPT } from '../types/source'

interface UploadDialogProps {
  isOpen: boolean
  onAddFiles: (files: File[]) => void
  onClose: () => void
}

const SUPPORTED_FORMATS = ['PDF', 'DOCX', 'TXT', 'Markdown']

export function UploadDialog({ isOpen, onAddFiles, onClose }: UploadDialogProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialogRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) {
      setIsDragging(false)
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const addSelectedFiles = (selectedFiles: File[]) => {
    const validFiles = selectedFiles.filter((file) => getKnowledgeSourceType(file) !== null)
    const invalidCount = selectedFiles.length - validFiles.length

    if (validFiles.length > 0) onAddFiles(validFiles)

    if (invalidCount > 0) {
      setError(
        `${invalidCount} ${invalidCount === 1 ? 'file is' : 'files are'} unsupported. Choose PDF, DOCX, TXT, or Markdown files.`,
      )
      return
    }

    if (validFiles.length > 0) onClose()
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    addSelectedFiles(Array.from(event.target.files ?? []))
    event.target.value = ''
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    addSelectedFiles(Array.from(event.dataTransfer.files))
  }

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-neutral-950/25 p-4 backdrop-blur-[2px] [animation:knowledge-dialog-in_160ms_ease-out]"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="knowledge-upload-title"
        aria-describedby="knowledge-upload-description"
        tabIndex={-1}
        className="w-full max-w-md overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-[0_24px_70px_-28px_rgba(20,20,20,0.5)] outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
      >
        <header className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4">
          <div>
            <h2 id="knowledge-upload-title" className="text-sm font-semibold text-neutral-950">
              Add Knowledge Source
            </h2>
            <p id="knowledge-upload-description" className="mt-1 text-xs leading-5 text-neutral-500">
              Choose one or more files to add as knowledge sources.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close upload dialog"
            title="Close"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
          >
            <X size={16} strokeWidth={2} aria-hidden />
          </button>
        </header>

        <div className="p-5">
          <div
            aria-label="File drop area"
            onDragEnter={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsDragging(false)
              }
            }}
            onDrop={handleDrop}
            className={cn(
              'flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed px-6 py-8 text-center transition-[border-color,background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35',
              isDragging
                ? 'border-indigo-400 bg-indigo-50/60 shadow-[0_0_0_3px_rgba(99,102,241,0.08)]'
                : 'border-neutral-300 bg-neutral-50/70 hover:border-neutral-400 hover:bg-neutral-50',
            )}
          >
            <span
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-lg border bg-white shadow-sm transition-colors',
                isDragging
                  ? 'border-indigo-200 text-indigo-600'
                  : 'border-neutral-200 text-neutral-600',
              )}
              aria-hidden
            >
              <FileUp size={21} strokeWidth={1.8} />
            </span>
            <p className="mt-4 text-sm font-semibold text-neutral-900">
              {isDragging ? 'Drop files to add them' : 'Drag and drop files here'}
            </p>
            <p className="mt-1 text-xs text-neutral-500">or choose files from your device</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-neutral-900 px-3.5 text-xs font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] hover:bg-neutral-800 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-2"
            >
              <Upload size={14} strokeWidth={2} aria-hidden />
              Browse Files
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={KNOWLEDGE_SOURCE_ACCEPT}
              onChange={handleInputChange}
              className="sr-only"
              aria-label="Choose knowledge source files"
              tabIndex={-1}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-1.5" aria-label="Supported formats">
            <span className="mr-1 text-[11px] font-medium text-neutral-500">Supported:</span>
            {SUPPORTED_FORMATS.map((format) => (
              <span
                key={format}
                className="rounded-md bg-neutral-100 px-2 py-1 text-[10px] font-semibold text-neutral-600"
              >
                {format}
              </span>
            ))}
          </div>

          {error && (
            <p className="mt-3 text-xs leading-5 text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        <footer className="flex justify-end border-t border-neutral-200 bg-neutral-50/70 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-200/70 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
