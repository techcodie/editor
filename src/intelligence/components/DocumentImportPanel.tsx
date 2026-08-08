import { useCallback, useEffect, useRef, useState } from 'react'
import { useOverlayStack } from '../../hooks/useOverlayStack'
import {
  ArrowLeft,
  BookOpen,
  FileInput,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Layers3,
  RotateCcw,
  ScanText,
  Upload,
  X,
} from 'lucide-react'
import type { PreparedKnowledgeSource } from '../../knowledge/types/source'
import type { EditorApi } from '../../lib/editor-api'
import { cn } from '../../lib/cn'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useDocumentImport } from '../hooks/useDocumentImport'
import {
  DOCUMENT_INTELLIGENCE_ACCEPT,
  classifyDocument,
  validateIntelligenceFile,
} from '../services/documentClassifier'
import { documentModelToEditorHtml } from '../services/documentIntelligence'
import type { DocumentModel } from '../types/documentModel'
import { ExtractionSidebar } from './ExtractionSidebar'
import { ImportProgress } from './ImportProgress'
import { LayoutViewer } from './LayoutViewer'
import { OCRPreview } from './OCRPreview'

type PreviewMode = 'original' | 'structure' | 'text'

interface DocumentImportPanelProps {
  isOpen: boolean
  api: EditorApi | null
  canSaveSource: boolean
  onSaveSource: (source: PreparedKnowledgeSource) => void
  onClose: () => void
}

function modelSourceType(model: DocumentModel): PreparedKnowledgeSource['type'] {
  if (model.metadata.fileType === 'text') return 'txt'
  return model.metadata.fileType
}

function toPreparedSource(file: File, model: DocumentModel): PreparedKnowledgeSource {
  return {
    name: file.name,
    type: modelSourceType(model),
    size: file.size,
    text: model.text,
    file,
    pageCount: model.pages.length,
  }
}

function OriginalPreview({ file }: { file: File }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    const nextUrl = URL.createObjectURL(file)
    setUrl(nextUrl)
    return () => URL.revokeObjectURL(nextUrl)
  }, [file])
  const type = classifyDocument(file)

  return (
    <section className="flex h-full items-center justify-center overflow-auto bg-neutral-100 p-4 sm:p-6" aria-label="Original document">
      {type === 'image' ? (
        url && <img src={url} alt={`Original ${file.name}`} className="max-h-full max-w-full rounded-md bg-white object-contain shadow-lg" />
      ) : type === 'pdf' ? (
        url && <iframe src={url} title={`Original ${file.name}`} className="h-full min-h-[30rem] w-full max-w-[54rem] rounded-md border border-neutral-200 bg-white shadow-sm" />
      ) : (
        <div className="max-w-sm rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <FileText size={30} className="mx-auto text-neutral-400" aria-hidden />
          <h3 className="mt-3 truncate text-sm font-semibold text-neutral-950">{file.name}</h3>
          <p className="mt-1 text-xs leading-5 text-neutral-500">The original Office or text file is preserved. Use Structure or Text to inspect the recognized content.</p>
        </div>
      )}
    </section>
  )
}

export function DocumentImportPanel({
  isOpen,
  api,
  canSaveSource,
  onSaveSource,
  onClose,
}: DocumentImportPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const { file, model, progress, error, isProcessing, importDocument, cancel, clear } = useDocumentImport()
  const [previewMode, setPreviewMode] = useState<PreviewMode>('original')
  const [notice, setNotice] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const isTopmost = useOverlayStack(isOpen)

  useEffect(() => {
    if (!isOpen) return
    previousFocusRef.current = document.activeElement as HTMLElement | null
    window.requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>('[aria-label="Close document intelligence"]')?.focus())
    return () => previousFocusRef.current?.focus()
  }, [isOpen])

  // Closing must also clear() the last file/result — otherwise reopening
  // Import shows the previous attempt's success or error screen instead of a
  // fresh picker, with no visible way back to it besides the small "choose
  // another document" arrow.
  const closePanel = useCallback(() => {
    clear()
    onClose()
  }, [clear, onClose])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!isTopmost()) return
        event.preventDefault()
        if (isProcessing) cancel()
        else closePanel()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])')]
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
  }, [cancel, closePanel, isOpen, isProcessing, isTopmost])

  const chooseFile = (nextFile?: File) => {
    if (!nextFile) return
    const validationError = validateIntelligenceFile(nextFile)
    if (validationError) {
      setNotice(validationError)
      return
    }
    setNotice(null)
    setPreviewMode('original')
    void importDocument(nextFile)
  }

  const [isInserting, setIsInserting] = useState(false)

  const insert = () => {
    if (!api || !model || isInserting) return
    setIsInserting(true)
    // insertStructuredContent's own chain already focuses and scrolls the
    // new content into view (see create-editor-api.ts), so on success the
    // panel just needs to get out of the way — closing it, restoring focus
    // once more (defensive: the panel's own focus trap moved focus onto its
    // own DOM while it was open), so the user can start typing immediately.
    const didInsert = api.insertStructuredContent({
      target: 'cursor',
      content: documentModelToEditorHtml(model),
      provenance: {
        responseId: `document-intelligence:${model.id}`,
        sourceIds: [model.id],
        timestamp: Date.now(),
      },
    })
    if (didInsert) {
      closePanel()
      api.focus()
    } else {
      setNotice('Place the cursor in the editor and try again.')
    }
    setIsInserting(false)
  }

  // "Open" as a file-open action distinct from "Import" (insert): clears the
  // current document first, through the same Editor API `insert` already
  // uses — no new capability, just a different insertion target.
  const [isOpenConfirmOpen, setIsOpenConfirmOpen] = useState(false)

  const openAsNewDocument = () => {
    if (!api || !model) return
    setIsOpenConfirmOpen(true)
  }

  const confirmOpenAsNewDocument = () => {
    setIsOpenConfirmOpen(false)
    if (!api || !model) return
    api.replaceDocumentSnapshot({ type: 'doc', content: [{ type: 'paragraph' }] })
    const didOpen = api.insertStructuredContent({
      target: 'cursor',
      content: documentModelToEditorHtml(model),
      provenance: {
        responseId: `document-intelligence:${model.id}`,
        sourceIds: [model.id],
        timestamp: Date.now(),
      },
    })
    if (didOpen) {
      closePanel()
      api.focus()
    } else {
      setNotice('Could not open the document. Try again.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] bg-neutral-950/40 p-0 backdrop-blur-[2px] sm:p-4 lg:p-6">
      <div id="document-intelligence-panel" ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="document-intelligence-title" className="mx-auto flex h-full w-full max-w-[78rem] flex-col overflow-hidden bg-white text-neutral-950 shadow-[var(--document-editor-shadow-overlay)] sm:rounded-lg sm:border sm:border-neutral-200">
        <header className="flex h-14 shrink-0 items-center border-b border-neutral-200 px-3 sm:px-4">
          {file && (
            <button type="button" onClick={clear} disabled={isProcessing} aria-label="Choose another document" className="mr-2 flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]">
              <ArrowLeft size={16} aria-hidden />
            </button>
          )}
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-700"><ScanText size={16} aria-hidden /></span>
          <div className="ml-3 min-w-0">
            <h2 id="document-intelligence-title" className="truncate text-sm font-semibold">Document Intelligence</h2>
            <p className="truncate text-[10px] text-neutral-500">OCR, layout, metadata, and AI-ready context</p>
          </div>
          <button type="button" onClick={() => { cancel(); closePanel() }} aria-label="Close document intelligence" className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"><X size={16} aria-hidden /></button>
        </header>

        {!file ? (
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-5 sm:p-8">
            <div className="w-full max-w-2xl">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragEnter={(event) => { event.preventDefault(); setIsDragging(true) }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => { event.preventDefault(); setIsDragging(false); chooseFile(event.dataTransfer.files[0]) }}
                className={cn('flex min-h-72 w-full flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center transition-[border-color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]', isDragging ? 'border-indigo-500 bg-indigo-50/70 shadow-inner' : 'border-neutral-300 bg-neutral-50 hover:border-neutral-400 hover:bg-white')}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-indigo-700 shadow-sm ring-1 ring-neutral-200"><Upload size={21} aria-hidden /></span>
                <strong className="mt-4 text-sm">Import a document</strong>
                <span className="mt-1 max-w-sm text-xs leading-5 text-neutral-500">Drop a PDF, scanned document, screenshot, photo, Word document, or text file here.</span>
                <span className="mt-4 rounded-md bg-neutral-900 px-3 py-2 text-[11px] font-semibold text-white">Choose file</span>
              </button>
              <input ref={inputRef} type="file" accept={DOCUMENT_INTELLIGENCE_ACCEPT} className="sr-only" onChange={(event) => { chooseFile(event.target.files?.[0]); event.target.value = '' }} />
              {notice && <p className="mt-3 text-center text-xs text-red-600" role="alert">{notice}</p>}
              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px] text-neutral-500">
                <span className="rounded-md bg-neutral-50 px-2 py-2">Images & scans</span>
                <span className="rounded-md bg-neutral-50 px-2 py-2">Multi-page PDF</span>
                <span className="rounded-md bg-neutral-50 px-2 py-2">DOCX & text</span>
              </div>
            </div>
          </div>
        ) : !model ? (
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto">
            {error || progress.stage === 'cancelled' ? (
              <div className="max-w-md p-6 text-center">
                <ScanText size={30} className="mx-auto text-neutral-400" aria-hidden />
                <h3 className="mt-3 text-sm font-semibold">{progress.stage === 'cancelled' ? 'Analysis cancelled' : 'Document analysis failed'}</h3>
                <p className="mt-1 text-xs leading-5 text-neutral-500">{error ?? 'You can restart when ready.'}</p>
                <button type="button" onClick={() => void importDocument(file)} className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-neutral-900 px-4 text-[11px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"><RotateCcw size={14} aria-hidden />Try again</button>
              </div>
            ) : (
              <ImportProgress progress={progress} onCancel={cancel} />
            )}
          </div>
        ) : (
          <>
            <div className="flex h-12 shrink-0 items-center gap-2 border-b border-neutral-200 px-3 sm:px-4">
              <div className="flex min-w-0 rounded-md bg-neutral-100 p-0.5" role="tablist" aria-label="Document preview mode">
                {([
                  ['original', ImageIcon, 'Original'],
                  ['structure', Layers3, 'Structure'],
                  ['text', FileText, 'Text'],
                ] as const).map(([mode, Icon, label]) => (
                  <button key={mode} type="button" role="tab" aria-label={label} aria-selected={previewMode === mode} onClick={() => setPreviewMode(mode)} className={cn('inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]', previewMode === mode ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-900')}><Icon size={13} aria-hidden /><span className="hidden sm:inline">{label}</span></button>
                ))}
              </div>
              <span className="ml-auto truncate text-[10px] text-neutral-500">{file.name}</span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
              <div className="min-h-[22rem] min-w-0 flex-1">
                {previewMode === 'original' && <OriginalPreview file={file} />}
                {previewMode === 'structure' && <LayoutViewer model={model} />}
                {previewMode === 'text' && <OCRPreview model={model} />}
              </div>
              <ExtractionSidebar model={model} />
            </div>
            <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-neutral-200 bg-neutral-50 px-3 py-3 sm:px-4">
              {notice && <p className="mr-auto text-[11px] text-neutral-600" role="status">{notice}</p>}
              {!notice && <span className="mr-auto text-[10px] text-neutral-500">Review recognized content before adding it.</span>}
              {canSaveSource && (
                <button type="button" disabled={!model.text.trim()} onClick={() => onSaveSource(toPreparedSource(file, model))} className="inline-flex h-9 items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-[11px] font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"><BookOpen size={14} aria-hidden />Save as source</button>
              )}
              <button type="button" disabled={!api || !model.text.trim()} onClick={openAsNewDocument} className="inline-flex h-9 items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-[11px] font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"><FolderOpen size={14} aria-hidden />Open as new document</button>
              <button type="button" disabled={!api || !model.text.trim() || isInserting} onClick={insert} className="inline-flex h-9 items-center gap-2 rounded-md bg-neutral-900 px-4 text-[11px] font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"><FileInput size={14} aria-hidden />Insert into editor</button>
            </footer>
          </>
        )}
      </div>
      <ConfirmDialog
        isOpen={isOpenConfirmOpen}
        title="Replace the current document?"
        description="Your current content will be cleared. Undo will restore it."
        confirmLabel="Open document"
        onConfirm={confirmOpenAsNewDocument}
        onCancel={() => setIsOpenConfirmOpen(false)}
      />
    </div>
  )
}
