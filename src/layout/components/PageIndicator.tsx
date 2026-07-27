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

export function PageIndicator({ layout, pagination, onRemoveBreak }: PageIndicatorProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-label="Page layout indicators">
      {pagination.pages.map((page) => {
        const showNumber = layout.pageNumber.enabled && !(layout.pageNumber.hideFirstPage && page.index === 0)
        return (
          <div key={page.id}>
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
      {pagination.breaks.map((pageBreak) => (
        <PageBreakIndicator key={pageBreak.id} pageBreak={pageBreak} onRemove={onRemoveBreak} />
      ))}
      <span className="sticky top-3 ml-auto mr-3 mt-3 block w-fit rounded-md border border-neutral-200 bg-white/90 px-2 py-1 text-[10px] font-semibold tabular-nums text-neutral-500 shadow-sm backdrop-blur">
        Page {pagination.currentPage} of {pagination.pages.length}
      </span>
    </div>
  )
}
