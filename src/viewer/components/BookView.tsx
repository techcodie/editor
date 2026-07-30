import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Minus, Plus, X } from 'lucide-react'
import { resolvePageMetrics } from '../../layout/services/pageMetrics'
import type { PageLayout } from '../../layout/types/layout'
import type { DocumentViewMode, ViewerPage, ViewerZoom } from '../types/viewer'
import { clampViewerPage } from '../services/viewManager'
import { ViewSwitcher } from './ViewSwitcher'
import { ViewerPageCanvas } from './ViewerPageCanvas'

interface BookViewProps {
  pages: ViewerPage[]
  layout: PageLayout
  zoom: ViewerZoom
  onZoomIn: () => void
  onZoomOut: () => void
  onModeChange: (mode: DocumentViewMode) => void
  onClose: () => void
}

export function BookView({ pages, layout, zoom, onZoomIn, onZoomOut, onModeChange, onClose }: BookViewProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1)
  const [direction, setDirection] = useState<'next' | 'previous'>('next')
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight })
  const isSinglePage = viewport.width < 720
  const step = isSinglePage ? 1 : 2
  const metrics = useMemo(() => resolvePageMetrics(layout), [layout])
  const availableWidth = viewport.width - (isSinglePage ? 28 : 64)
  const fitScale = Math.min(1, availableWidth / (metrics.width * (isSinglePage ? 1 : 2)), (viewport.height - 112) / metrics.height)
  const scale = fitScale * (zoom / 100)
  const visiblePages = isSinglePage ? [pages[page - 1]] : [pages[page - 1], pages[page]].filter(Boolean)

  const move = useCallback((offset: number) => {
    setDirection(offset > 0 ? 'next' : 'previous')
    setPage((current) => clampViewerPage(current + offset, pages.length))
  }, [pages.length])

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>('[aria-label="Close book view"]')?.focus())
    return () => previous?.focus()
  }, [])

  useEffect(() => {
    const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    if (!isSinglePage && page % 2 === 0) setPage((current) => Math.max(1, current - 1))
  }, [isSinglePage, page])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        move(-step)
      } else if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault()
        move(step)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [move, onClose, step])

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="book-view-title" className="fixed inset-0 z-[90] flex flex-col overflow-hidden bg-[#e8e8e5] text-neutral-950">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-neutral-200 bg-white px-3 sm:px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-700"><BookOpen size={16} aria-hidden /></span>
        <div className="min-w-0"><h1 id="book-view-title" className="truncate text-sm font-semibold">Book view</h1><p className="text-[10px] text-neutral-500">{isSinglePage ? `Page ${page}` : `Pages ${page}-${Math.min(page + 1, pages.length)}`} of {pages.length}</p></div>
        <div className="ml-auto hidden sm:block"><ViewSwitcher mode="book" onChange={onModeChange} compact /></div>
        <div className="flex items-center rounded-md border border-neutral-200 bg-neutral-50 p-0.5">
          <button type="button" onClick={onZoomOut} disabled={zoom === 50} aria-label="Zoom out" className="flex h-7 w-7 items-center justify-center rounded hover:bg-white disabled:opacity-30"><Minus size={14} aria-hidden /></button>
          <span className="w-11 text-center text-[10px] font-semibold tabular-nums">{zoom}%</span>
          <button type="button" onClick={onZoomIn} disabled={zoom === 150} aria-label="Zoom in" className="flex h-7 w-7 items-center justify-center rounded hover:bg-white disabled:opacity-30"><Plus size={14} aria-hidden /></button>
        </div>
        <button type="button" onClick={onClose} aria-label="Close book view" className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><X size={17} aria-hidden /></button>
      </header>
      <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto p-3 sm:p-6">
        <button type="button" onClick={() => move(-step)} disabled={page === 1} aria-label="Previous pages" className="fixed left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white/95 shadow-md hover:bg-white disabled:opacity-30 sm:left-5"><ChevronLeft size={19} aria-hidden /></button>
        <div key={`${page}-${isSinglePage}`} className={`book-page-turn flex origin-center items-center [perspective:1600px] ${direction === 'next' ? '[animation:book-page-next_220ms_ease-out]' : '[animation:book-page-previous_220ms_ease-out]'}`}>
          {visiblePages.map((visiblePage, index) => (
            <ViewerPageCanvas
              key={visiblePage.number}
              page={visiblePage}
              width={metrics.width * scale}
              height={metrics.height * scale}
              scale={scale}
              header={layout.header}
              footer={layout.footer}
              pageNumber={layout.pageNumber}
              className={index === 0 && visiblePages.length === 2 ? 'border-r border-neutral-200' : ''}
            />
          ))}
        </div>
        <button type="button" onClick={() => move(step)} disabled={page + step > pages.length} aria-label="Next pages" className="fixed right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white/95 shadow-md hover:bg-white disabled:opacity-30 sm:right-5"><ChevronRight size={19} aria-hidden /></button>
      </main>
    </div>
  )
}
