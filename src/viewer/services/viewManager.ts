import { paginateText } from '../../layout/services/paginationEngine'
import { resolvePageMetrics } from '../../layout/services/pageMetrics'
import type { PageLayout } from '../../layout/types/layout'
import type { PaginationSnapshot } from '../../layout/types/page'
import type { DocumentViewMode, ViewerPage, ViewerZoom } from '../types/viewer'

export const DOCUMENT_VIEW_MODES: ReadonlyArray<{
  id: DocumentViewMode
  label: string
}> = [
  { id: 'editor', label: 'Editor view' },
  { id: 'pdf-preview', label: 'PDF preview' },
  { id: 'carousel', label: 'Horizontal carousel' },
  { id: 'book', label: 'Book view' },
  { id: 'reading', label: 'Reading mode' },
]

export const VIEWER_ZOOM_LEVELS: ViewerZoom[] = [50, 75, 100, 125, 150]

export function createGoogleSearchUrl(selectedText: string): string | null {
  const query = selectedText.trim().replace(/\s+/g, ' ').slice(0, 500)
  return query ? `https://www.google.com/search?q=${encodeURIComponent(query)}` : null
}

export function openGoogleSearch(selectedText: string): boolean {
  const url = createGoogleSearchUrl(selectedText)
  if (!url) return false
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}

export function createViewerPages(
  text: string,
  layout: PageLayout,
  pagination: PaginationSnapshot,
): ViewerPage[] {
  const metrics = resolvePageMetrics(layout)
  return paginateText(
    text,
    metrics.contentWidth,
    metrics.contentHeight,
    pagination.pages.length,
  ).map((pageText, index) => ({ number: index + 1, text: pageText }))
}

export function clampViewerPage(page: number, pageCount: number): number {
  return Math.min(Math.max(1, Math.round(page)), Math.max(1, pageCount))
}

export function nextViewerZoom(current: ViewerZoom, direction: -1 | 1): ViewerZoom {
  const index = VIEWER_ZOOM_LEVELS.indexOf(current)
  const nextIndex = Math.min(
    VIEWER_ZOOM_LEVELS.length - 1,
    Math.max(0, index + direction),
  )
  return VIEWER_ZOOM_LEVELS[nextIndex]
}
