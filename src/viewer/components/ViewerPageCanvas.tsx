import { memo } from 'react'
import type { CSSProperties } from 'react'
import type { HeaderFooterContent, PageNumberSettings } from '../../layout/types/layout'
import type { ViewerPage } from '../types/viewer'

interface ViewerPageCanvasProps {
  page: ViewerPage
  width: number
  height: number
  scale: number
  header: HeaderFooterContent
  footer: HeaderFooterContent
  pageNumber: PageNumberSettings
  renderContent?: boolean
  className?: string
}

function numberText(page: number, settings: PageNumberSettings): string {
  if (!settings.enabled || (settings.hideFirstPage && page === 1)) return ''
  return String(page)
}

function ViewerPageCanvasComponent({
  page,
  width,
  height,
  scale,
  header,
  footer,
  pageNumber,
  renderContent = true,
  className = '',
}: ViewerPageCanvasProps) {
  const style = {
    '--viewer-page-width': `${width}px`,
    '--viewer-page-height': `${height}px`,
    '--viewer-page-scale': String(scale),
  } as CSSProperties
  return (
    <section
      aria-label={`Page ${page.number}`}
      data-viewer-page={page.number}
      style={style}
      className={`relative h-[var(--viewer-page-height)] w-[var(--viewer-page-width)] shrink-0 overflow-hidden bg-white text-neutral-900 shadow-[0_4px_28px_-10px_rgba(20,20,20,0.28)] ${className}`}
    >
      {renderContent && (
        <>
          <header
            className="absolute left-8 right-8 top-4 truncate text-[10px] text-neutral-400"
            style={{ textAlign: header.alignment }}
          >
            {header.enabled ? header.text : ''}
            {pageNumber.position === 'top' && (
              <span className="block" style={{ textAlign: pageNumber.alignment }}>
                {numberText(page.number, pageNumber)}
              </span>
            )}
          </header>
          <div
            className="absolute inset-x-[8%] bottom-[8%] top-[8%] overflow-hidden whitespace-pre-wrap font-serif leading-[1.72] text-neutral-800"
            style={{ fontSize: `${15 * scale}px` }}
          >
            {page.text}
          </div>
          <footer
            className="absolute bottom-4 left-8 right-8 truncate text-[10px] text-neutral-400"
            style={{ textAlign: footer.alignment }}
          >
            {footer.enabled ? footer.text.replace('{page}', String(page.number)) : ''}
            {pageNumber.position === 'bottom' && (
              <span className="block" style={{ textAlign: pageNumber.alignment }}>
                {numberText(page.number, pageNumber)}
              </span>
            )}
          </footer>
        </>
      )}
    </section>
  )
}

export const ViewerPageCanvas = memo(ViewerPageCanvasComponent)
