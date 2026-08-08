import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Eye, Minus, Plus, X } from 'lucide-react'
import { useOverlayStack } from '../../hooks/useOverlayStack'
import type { EditorApi } from '../../lib/editor-api'
import { paginateText } from '../services/paginationEngine'
import { paperLabel, resolvePageMetrics } from '../services/pageMetrics'
import type { PageLayout, PrintZoom } from '../types/layout'
import type { PaginationSnapshot } from '../types/page'
import { WatermarkLayer } from '../../watermark/components/WatermarkLayer'
import type { Watermark } from '../../watermark/types/watermark'
import { PageNavigator } from './PageNavigator'

interface PrintPreviewProps {
  api: EditorApi
  documentText: string
  layout: PageLayout
  pagination: PaginationSnapshot
  zoom: PrintZoom
  watermark: Watermark | null
  onZoomChange: (zoom: PrintZoom) => void
  onClose: () => void
}

const ZOOM_LEVELS: PrintZoom[] = [50, 75, 100, 125, 150, 'fit-width']

function pageNumberText(layout: PageLayout, pageNumber: number): string {
  if (!layout.pageNumber.enabled) return ''
  if (layout.pageNumber.hideFirstPage && pageNumber === 1) return ''
  return String(pageNumber)
}

export function PrintPreview({
  api,
  documentText,
  layout,
  pagination,
  zoom,
  watermark,
  onZoomChange,
  onClose,
}: PrintPreviewProps) {
  const isTopmost = useOverlayStack(true)
  const dialogRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth)
  const metrics = useMemo(() => resolvePageMetrics(layout), [layout])
  const pages = useMemo(
    () => paginateText(
      documentText,
      metrics.contentWidth,
      metrics.contentHeight,
      pagination.pages.length,
    ),
    [documentText, metrics, pagination.pages.length],
  )
  const availableWidth = Math.max(240, viewportWidth - (viewportWidth >= 640 ? 240 : 32))
  const scale = zoom === 'fit-width'
    ? Math.min(1, availableWidth / metrics.width)
    : zoom / 100
  const pageWidth = metrics.width * scale
  const pageHeight = metrics.height * scale

  const jumpToPage = useCallback((page: number) => {
    const target = document.getElementById(`print-preview-page-${page}`)
    target?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    setCurrentPage(page)
  }, [])

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null
    api.setPrintPreviewMode(true)
    requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>('[aria-label="Close print preview"]')?.focus()
    })
    return () => {
      api.setPrintPreviewMode(false)
      previousFocusRef.current?.focus()
    }
  }, [api])

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!isTopmost()) return
        event.preventDefault()
        onClose()
        return
      }
      if (event.key === 'PageUp') {
        event.preventDefault()
        jumpToPage(Math.max(1, currentPage - 1))
      }
      if (event.key === 'PageDown') {
        event.preventDefault()
        jumpToPage(Math.min(pages.length, currentPage + 1))
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
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
  }, [currentPage, isTopmost, jumpToPage, onClose, pages.length])

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
  }, [])

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-preview-title"
      className="fixed inset-0 z-[90] flex flex-col overflow-hidden bg-[#e9e9e7] text-neutral-950"
    >
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-3 sm:px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-700">
          <Eye size={16} aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 id="print-preview-title" className="truncate text-sm font-semibold">Print preview</h1>
          <p className="text-[10px] text-neutral-500">
            {paperLabel(layout.paper)} · {layout.orientation} · {pages.length} pages
            {/* Honest, not faked: this preview re-flows plain text and can't
                represent tables, images, or rich formatting, so page count
                and breaks are an approximation of the live document, not a
                guarantee — see paginateText in paginationEngine.ts. */}
            <span className="text-neutral-400"> · Approximate — tables and images aren't shown here</span>
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-0.5">
          <button
            type="button"
            onClick={() => {
              const numeric = typeof zoom === 'number' ? zoom : 100
              onZoomChange(Math.max(50, numeric - 25) as PrintZoom)
            }}
            aria-label="Zoom out"
            disabled={zoom === 50}
            className="flex h-7 w-7 items-center justify-center rounded text-neutral-500 hover:bg-white hover:text-neutral-950 disabled:opacity-30"
          >
            <Minus size={14} aria-hidden />
          </button>
          <select
            value={zoom}
            onChange={(event) => onZoomChange(event.target.value === 'fit-width' ? 'fit-width' : Number(event.target.value) as PrintZoom)}
            aria-label="Preview zoom"
            className="h-7 rounded bg-transparent px-1 text-[11px] font-medium outline-none focus:ring-2 focus:ring-indigo-500/25"
          >
            {ZOOM_LEVELS.map((level) => (
              <option key={level} value={level}>{level === 'fit-width' ? 'Fit width' : `${level}%`}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              const numeric = typeof zoom === 'number' ? zoom : 100
              onZoomChange(Math.min(150, numeric + 25) as PrintZoom)
            }}
            aria-label="Zoom in"
            disabled={zoom === 150}
            className="flex h-7 w-7 items-center justify-center rounded text-neutral-500 hover:bg-white hover:text-neutral-950 disabled:opacity-30"
          >
            <Plus size={14} aria-hidden />
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close print preview"
          className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
        >
          <X size={17} aria-hidden />
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <PageNavigator pages={pages} currentPage={currentPage} onSelect={jumpToPage} />
        <main
          ref={scrollRef}
          onScroll={(event) => {
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
            frameRef.current = requestAnimationFrame(() => {
              const containerTop = event.currentTarget.getBoundingClientRect().top
              const pageElements = [...event.currentTarget.querySelectorAll<HTMLElement>('[data-preview-page]')]
              const closest = pageElements.reduce((best, page) =>
                Math.abs(page.getBoundingClientRect().top - containerTop - 20) <
                Math.abs(best.getBoundingClientRect().top - containerTop - 20) ? page : best,
              pageElements[0])
              if (closest) setCurrentPage(Number(closest.dataset.previewPage))
            })
          }}
          className="min-w-0 flex-1 overflow-auto overscroll-contain p-4 sm:p-6"
        >
          <div className="mx-auto flex w-max min-w-full flex-col items-center gap-4 sm:gap-6">
            {pages.map((content, index) => {
              const pageNumber = index + 1
              const shouldRender = Math.abs(pageNumber - currentPage) <= 1
              return (
                <section
                  key={`print-page-${pageNumber}`}
                  id={`print-preview-page-${pageNumber}`}
                  data-preview-page={pageNumber}
                  aria-label={`Page ${pageNumber}`}
                  className="relative shrink-0 overflow-hidden bg-white shadow-[0_2px_16px_rgba(20,20,20,0.16)]"
                  style={{ width: pageWidth, height: pageHeight }}
                >
                  {shouldRender && (
                    <>
                      <WatermarkLayer
                        watermark={watermark}
                        pages={[{
                          number: pageNumber,
                          top: 0,
                          width: pageWidth,
                          height: pageHeight,
                        }]}
                        currentPage={pagination.currentPage}
                      />
                      <header
                        className="absolute left-0 right-0 z-10 truncate text-[10px] text-neutral-400"
                        style={{
                          top: 12 * scale,
                          paddingInline: metrics.marginLeft * scale,
                          textAlign: layout.header.alignment,
                        }}
                      >
                        {layout.header.enabled ? layout.header.text : ''}
                        {layout.pageNumber.position === 'top' && (
                          <span className="block" style={{ textAlign: layout.pageNumber.alignment }}>{pageNumberText(layout, pageNumber)}</span>
                        )}
                      </header>
                      <div
                        className="relative z-10 whitespace-pre-wrap font-serif text-neutral-800"
                        style={{
                          paddingTop: metrics.marginTop * scale,
                          paddingRight: metrics.marginRight * scale,
                          paddingBottom: metrics.marginBottom * scale,
                          paddingLeft: metrics.marginLeft * scale,
                          fontSize: 15 * scale,
                          lineHeight: 1.7,
                        }}
                      >
                        {content}
                      </div>
                      <footer
                        className="absolute bottom-0 left-0 right-0 z-10 truncate text-[10px] text-neutral-400"
                        style={{
                          bottom: 12 * scale,
                          paddingInline: metrics.marginLeft * scale,
                          textAlign: layout.footer.alignment,
                        }}
                      >
                        {layout.footer.enabled ? layout.footer.text.replace('{page}', String(pageNumber)) : ''}
                        {layout.pageNumber.position === 'bottom' && (
                          <span className="block" style={{ textAlign: layout.pageNumber.alignment }}>{pageNumberText(layout, pageNumber)}</span>
                        )}
                      </footer>
                    </>
                  )}
                </section>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}
