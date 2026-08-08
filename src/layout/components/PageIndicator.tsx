import { useEffect, useRef, useState } from 'react'
import type { PageLayout } from '../types/layout'
import type { PaginationSnapshot } from '../types/page'
import { PageBreakIndicator } from './PageBreakIndicator'

interface PageIndicatorProps {
  layout: PageLayout
  pagination: PaginationSnapshot
  onRemoveBreak: (pageBreakId: string) => void
}

function alignedClass(alignment: 'left' | 'center' | 'right') {
  return alignment === 'left' ? 'text-left' : alignment === 'right' ? 'text-right' : 'text-center'
}

// A page counts as "current" once its top has scrolled up to about this line
// below the sticky toolbar — the same scrollspy convention Google Docs uses,
// tracking scroll position rather than caret position.
const TOP_REFERENCE_LINE = 96

/** One page's worth of vertical space, used only to observe scroll position — not visible itself. */
function PageScrollSentinel({
  pageId,
  top,
  height,
  onRegister,
}: {
  pageId: string
  top: number
  height: number
  onRegister: (pageId: string, element: HTMLDivElement | null) => void
}) {
  return (
    <div
      ref={(element) => onRegister(pageId, element)}
      data-page-id={pageId}
      className="absolute inset-x-0"
      style={{ top, height }}
      aria-hidden
    />
  )
}

export function PageIndicator({ layout, pagination, onRemoveBreak }: PageIndicatorProps) {
  const sentinels = useRef(new Map<string, HTMLDivElement>())
  const [scrollVisiblePage, setScrollVisiblePage] = useState<number | null>(null)

  const registerSentinel = (pageId: string, element: HTMLDivElement | null) => {
    if (element) sentinels.current.set(pageId, element)
    else sentinels.current.delete(pageId)
  }

  useEffect(() => {
    const elements = [...sentinels.current.values()]
    if (elements.length === 0) return

    const tops = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const pageId = (entry.target as HTMLElement).dataset.pageId
          if (pageId) tops.set(pageId, entry.boundingClientRect.top)
        }
        let bestId: string | null = null
        let bestTop = -Infinity
        for (const [pageId, top] of tops) {
          if (top <= TOP_REFERENCE_LINE && top > bestTop) {
            bestTop = top
            bestId = pageId
          }
        }
        if (!bestId) {
          let minTop = Infinity
          for (const [pageId, top] of tops) {
            if (top < minTop) {
              minTop = top
              bestId = pageId
            }
          }
        }
        const page = pagination.pages.find((item) => item.id === bestId)
        if (page) setScrollVisiblePage(page.number)
      },
      { threshold: [0, 0.01, 0.25, 0.5, 0.75, 0.99, 1] },
    )
    for (const element of elements) observer.observe(element)
    return () => observer.disconnect()
  }, [pagination.pages])

  const currentPage = scrollVisiblePage ?? pagination.currentPage

  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-label="Page layout indicators">
      {pagination.pages.map((page) => {
        const showNumber = layout.pageNumber.enabled && !(layout.pageNumber.hideFirstPage && page.index === 0)
        return (
          <div key={page.id}>
            <PageScrollSentinel pageId={page.id} top={page.top} height={page.height} onRegister={registerSentinel} />
            <div
              className={`absolute left-[var(--page-margin-left)] right-[var(--page-margin-right)] truncate text-[10px] text-neutral-400 ${alignedClass(layout.header.alignment)}`}
              style={{ top: page.top + 12 }}
            >
              {layout.header.enabled ? layout.header.text : ''}
              {showNumber && layout.pageNumber.position === 'top' && (
                <span className={`block ${alignedClass(layout.pageNumber.alignment)}`}>{page.number}</span>
              )}
            </div>
            <div
              className={`absolute left-[var(--page-margin-left)] right-[var(--page-margin-right)] truncate text-[10px] text-neutral-400 ${alignedClass(layout.footer.alignment)}`}
              style={{ top: page.top + page.height - 24 }}
            >
              {layout.footer.enabled ? layout.footer.text.replace('{page}', String(page.number)) : ''}
              {showNumber && layout.pageNumber.position === 'bottom' && (
                <span className={`block ${alignedClass(layout.pageNumber.alignment)}`}>{page.number}</span>
              )}
            </div>
          </div>
        )
      })}
      {pagination.breaks.filter((pageBreak) => pageBreak.manual).map((pageBreak) => (
        <PageBreakIndicator key={pageBreak.id} pageBreak={pageBreak} onRemove={onRemoveBreak} />
      ))}
      <span className="sticky top-[4.5rem] z-20 ml-auto mr-3 block w-fit rounded-md bg-white/85 px-2 py-1 text-[10px] font-semibold tabular-nums text-neutral-400 shadow-[0_1px_2px_rgba(20,20,20,0.06)] backdrop-blur">
        Page {currentPage} of {pagination.pages.length}
      </span>
    </div>
  )
}
