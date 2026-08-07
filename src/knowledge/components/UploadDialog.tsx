import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { FileUp, Upload } from 'lucide-react'
import { Dialog } from '../../components/ui/Dialog'
import { cn } from '../../lib/cn'
import { KNOWLEDGE_SOURCE_ACCEPT, validateKnowledgeSourceFile } from '../types/source'

interface UploadDialogProps {
  isOpen: boolean
  onAddFiles: (files: File[]) => void
  onClose: () => void
}

const SUPPORTED_FORMATS = ['PDF', 'DOCX', 'TXT', 'Markdown']

export function UploadDialog({ isOpen, onAddFiles, onClose }: UploadDialogProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setIsDragging(false)
      setError(null)
    }
  }, [isOpen])

  const addSelectedFiles = (selectedFiles: File[]) => {
    const validationResults = selectedFiles.map((file) => ({
      file,
      error: validateKnowledgeSourceFile(file),
    }))
    const validFiles = validationResults
      .filter((result) => result.error === null)
      .map((result) => result.file)
    const errors = validationResults.flatMap((result) => (result.error ? [result.error] : []))

    if (validFiles.length > 0) onAddFiles(validFiles)

    if (errors.length > 0) {
      setError(errors.length === 1 ? errors[0] : `${errors[0]} ${errors.length - 1} more were skipped.`)
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

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add Knowledge Source"
      subtitle="Choose one or more files to add as knowledge sources."
      maxWidthClassName="max-w-md"
      bodyClassName="p-5"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="ml-auto inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-200/70 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
        >
          Cancel
        </button>
      }
    >
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
          'flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed px-6 py-8 text-center transition-[border-color,background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]',
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
          className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-neutral-900 px-3.5 text-xs font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] hover:bg-neutral-800 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] focus-visible:ring-offset-2"
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

      <div className="min-h-5" aria-live="polite">
        {error && (
          <p className="mt-3 text-xs leading-5 text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  )
}
