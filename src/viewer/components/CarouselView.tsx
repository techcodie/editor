import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Minus, Plus, Rows3, X } from 'lucide-react'
import { resolvePageMetrics } from '../../layout/services/pageMetrics'
import type { PageLayout } from '../../layout/types/layout'
import type { DocumentViewMode, ViewerPage, ViewerZoom } from '../types/viewer'
import { clampViewerPage } from '../services/viewManager'
import { ViewSwitcher } from './ViewSwitcher'
import { ViewerPageCanvas } from './ViewerPageCanvas'

interface CarouselViewProps {
  pages: ViewerPage[]
  layout: PageLayout
  zoom: ViewerZoom
  onZoomIn: () => void
  onZoomOut: () => void
  onModeChange: (mode: DocumentViewMode) => void
  onClose: () => void
}

export function CarouselView({
  pages,
  layout,
  zoom,
  onZoomIn,
  onZoomOut,
  onModeChange,
  onClose,
}: CarouselViewProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight })
  const metrics = useMemo(() => resolvePageMetrics(layout), [layout])
  const fitScale = Math.min(1, (viewport.width - 40) / metrics.width, (viewport.height - 112) / metrics.height)
  const scale = fitScale * (zoom / 100)

  const goToPage = useCallback((page: number) => {
    const next = clampViewerPage(page, pages.length)
    scrollRef.current
      ?.querySelector<HTMLElement>(`[data-viewer-page="${next}"]`)
      ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    setCurrentPage(next)
  }, [pages.length])

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>('[aria-label="Close carousel view"]')?.focus())
    return () => previous?.focus()
  }, [])

  useEffect(() => {
    const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        goToPage(currentPage - 1)
      } else if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault()
        goToPage(currentPage + 1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, goToPage, onClose])

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
  }, [])

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="carousel-view-title" className="fixed inset-0 z-[90] flex flex-col overflow-hidden bg-[#e8e8e5] text-neutral-950">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-neutral-200 bg-white px-3 sm:px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-700"><Rows3 size={16} aria-hidden /></span>
        <div className="min-w-0"><h1 id="carousel-view-title" className="truncate text-sm font-semibold">Horizontal carousel</h1><p className="text-[10px] text-neutral-500">Page {currentPage} of {pages.length}</p></div>
        <div className="ml-auto hidden sm:block"><ViewSwitcher mode="carousel" onChange={onModeChange} compact /></div>
        <div className="flex items-center rounded-md border border-neutral-200 bg-neutral-50 p-0.5">
          <button type="button" onClick={onZoomOut} disabled={zoom === 50} aria-label="Zoom out" className="flex h-7 w-7 items-center justify-center rounded hover:bg-white disabled:opacity-30"><Minus size={14} aria-hidden /></button>
          <span className="w-11 text-center text-[10px] font-semibold tabular-nums">{zoom}%</span>
          <button type="button" onClick={onZoomIn} disabled={zoom === 150} aria-label="Zoom in" className="flex h-7 w-7 items-center justify-center rounded hover:bg-white disabled:opacity-30"><Plus size={14} aria-hidden /></button>
        </div>
        <button type="button" onClick={onClose} aria-label="Close carousel view" className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><X size={17} aria-hidden /></button>
      </header>
      <main
        ref={scrollRef}
        onScroll={(event) => {
          const container = event.currentTarget
          if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
          frameRef.current = requestAnimationFrame(() => {
            const center = container.getBoundingClientRect().left + container.clientWidth / 2
            const items = [...container.querySelectorAll<HTMLElement>('[data-viewer-page]')]
            if (items.length === 0) return
            const closest = items.reduce((best, item) => Math.abs(item.getBoundingClientRect().left + item.clientWidth / 2 - center) < Math.abs(best.getBoundingClientRect().left + best.clientWidth / 2 - center) ? item : best, items[0])
            if (closest) setCurrentPage(Number(closest.dataset.viewerPage))
          })
        }}
        className="viewer-scroll flex min-h-0 flex-1 snap-x snap-mandatory items-center gap-5 overflow-x-auto overflow-y-hidden overscroll-x-contain px-[max(1.25rem,calc(50vw-20rem))] py-5 scroll-smooth sm:gap-8 sm:py-7"
      >
        {pages.map((page) => (
          <ViewerPageCanvas
            key={page.number}
            page={page}
            width={metrics.width * scale}
            height={metrics.height * scale}
            scale={scale}
            header={layout.header}
            footer={layout.footer}
            pageNumber={layout.pageNumber}
            renderContent={Math.abs(page.number - currentPage) <= 1}
            className="snap-center"
          />
        ))}
      </main>
      <footer className="flex h-12 shrink-0 items-center justify-center gap-2 border-t border-neutral-200 bg-white/95 px-3">
        <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page" className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-neutral-100 disabled:opacity-30"><ChevronLeft size={16} aria-hidden /></button>
        <span className="min-w-20 text-center text-xs font-semibold tabular-nums">{currentPage} / {pages.length}</span>
        <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pages.length} aria-label="Next page" className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-neutral-100 disabled:opacity-30"><ChevronRight size={16} aria-hidden /></button>
      </footer>
    </div>
  )
}
