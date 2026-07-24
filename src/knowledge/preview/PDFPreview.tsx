import { memo, useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import { CircleAlert } from 'lucide-react'
import { loadPdfDocument } from '../services/pdfDocument'
import { PreviewLoading } from './PreviewLoading'

interface PDFPreviewProps {
  file: File
}

interface PDFPageCanvasProps {
  document: PDFDocumentProxy
  pageNumber: number
  width: number
}

const PDFPageCanvas = memo(function PDFPageCanvas({
  document,
  pageNumber,
  width,
}: PDFPageCanvasProps) {
  const frameRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [shouldRender, setShouldRender] = useState(false)
  const [isRendered, setIsRendered] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const frame = frameRef.current
    if (!frame || shouldRender) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRender(true)
          observer.disconnect()
        }
      },
      { rootMargin: '800px 0px' },
    )
    observer.observe(frame)
    return () => observer.disconnect()
  }, [shouldRender])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !shouldRender || width <= 0) return

    let disposed = false
    let renderTask: RenderTask | null = null

    const renderPage = async () => {
      setIsRendered(false)
      setHasError(false)

      try {
        const page = await document.getPage(pageNumber)
        if (disposed) return

        const baseViewport = page.getViewport({ scale: 1 })
        const cssScale = Math.min(width / baseViewport.width, 1.6)
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
        const viewport = page.getViewport({ scale: cssScale * pixelRatio })

        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        canvas.style.width = `${Math.floor(viewport.width / pixelRatio)}px`
        canvas.style.height = `${Math.floor(viewport.height / pixelRatio)}px`

        renderTask = page.render({ canvas, viewport })
        await renderTask.promise
        if (!disposed) setIsRendered(true)
      } catch {
        if (!disposed) setHasError(true)
      }
    }

    void renderPage()
    return () => {
      disposed = true
      renderTask?.cancel()
    }
  }, [document, pageNumber, shouldRender, width])

  return (
    <figure
      ref={frameRef}
      className="relative mx-auto min-h-72 w-full overflow-hidden rounded-md bg-white shadow-[0_1px_3px_rgba(20,20,20,0.12),0_24px_55px_-38px_rgba(20,20,20,0.45)] ring-1 ring-neutral-200 [content-visibility:auto] [contain-intrinsic-size:auto_48rem]"
      aria-label={`Page ${pageNumber}`}
    >
      {!isRendered && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-neutral-100" aria-hidden />
      )}
      {hasError ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-2 px-5 text-center text-neutral-500">
          <CircleAlert size={20} strokeWidth={1.8} aria-hidden />
          <p className="text-xs">Page {pageNumber} could not be rendered.</p>
        </div>
      ) : (
        <canvas ref={canvasRef} className="block max-w-full" />
      )}
      <figcaption className="sr-only">Page {pageNumber}</figcaption>
    </figure>
  )
})

export const PDFPreview = memo(function PDFPreview({ file }: PDFPreviewProps) {
  const pagesRef = useRef<HTMLDivElement>(null)
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null)
  const [availableWidth, setAvailableWidth] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const pages = pagesRef.current
    if (!pages) return

    const updateWidth = () => setAvailableWidth(Math.max(pages.clientWidth, 0))
    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(pages)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let disposed = false
    let loadedDocument: PDFDocumentProxy | null = null

    setDocument(null)
    setError(null)
    void loadPdfDocument(file)
      .then((pdfDocument) => {
        loadedDocument = pdfDocument
        if (disposed) {
          void pdfDocument.destroy()
        } else {
          setDocument(pdfDocument)
        }
      })
      .catch(() => {
        if (!disposed) setError('This PDF could not be rendered. Try removing it and uploading again.')
      })

    return () => {
      disposed = true
      if (loadedDocument) void loadedDocument.destroy()
    }
  }, [file])

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
      <div ref={pagesRef} className="w-full">
        {error ? (
          <div
            className="mx-auto flex max-w-md flex-col items-center rounded-lg border border-red-200 bg-white px-6 py-10 text-center shadow-sm"
            role="alert"
          >
            <CircleAlert size={24} strokeWidth={1.8} className="text-red-600" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-neutral-900">Preview unavailable</p>
            <p className="mt-1 text-xs leading-5 text-neutral-600">{error}</p>
          </div>
        ) : !document ? (
          <PreviewLoading />
        ) : (
          <div className="space-y-5">
            {Array.from({ length: document.numPages }, (_, index) => (
              <PDFPageCanvas
                key={index + 1}
                document={document}
                pageNumber={index + 1}
                width={availableWidth}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
})
