import { useState } from 'react'
import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Eye, FilePlus2, Ruler } from 'lucide-react'
import { cn } from '../../lib/cn'
import { PanelShell } from '../../components/ui/PanelShell'
import {
  setCustomMargins,
  setMarginPreset,
  setPaper,
} from '../services/layoutEngine'
import type { PageLayout } from '../types/layout'
import type { PaginationSnapshot } from '../types/page'
import { HeaderFooterEditor } from './HeaderFooterEditor'
import { MarginEditor } from './MarginEditor'
import { OrientationSelector } from './OrientationSelector'
import { PaperSelector } from './PaperSelector'

interface PageLayoutToolbarControlProps {
  isOpen: boolean
  onToggle: () => void
}

export function PageLayoutToolbarControl({ isOpen, onToggle }: PageLayoutToolbarControlProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <ToolbarPrimitive.Button
          id="page-layout-trigger"
          type="button"
          aria-label={isOpen ? 'Close page layout' : 'Open page layout'}
          aria-controls="page-layout-panel"
          aria-expanded={isOpen}
          aria-pressed={isOpen}
          onClick={onToggle}
          className={cn(
            'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-[background-color,color,box-shadow,transform] duration-150 hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-1 focus-visible:ring-offset-white',
            isOpen && 'bg-indigo-700 text-white shadow-sm hover:bg-indigo-600 hover:text-white',
          )}
        >
          <Ruler size={16} strokeWidth={1.9} aria-hidden />
        </ToolbarPrimitive.Button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="bottom" sideOffset={6} className="z-50 select-none rounded-md bg-neutral-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45)]">
          Page layout
          <Tooltip.Arrow className="fill-neutral-900" width={10} height={5} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

interface PageLayoutPanelProps {
  isOpen: boolean
  layout: PageLayout
  pagination: PaginationSnapshot
  onLayoutChange: (layout: PageLayout) => void
  onInsertBreak: () => boolean
  onOpenPreview: () => void
  onClose: () => void
}

export function PageLayoutPanel({
  isOpen,
  layout,
  pagination,
  onLayoutChange,
  onInsertBreak,
  onOpenPreview,
  onClose,
}: PageLayoutPanelProps) {
  const [status, setStatus] = useState('')
  const manualBreakCount = pagination.breaks.filter((pageBreak) => pageBreak.manual).length

  return (
    <PanelShell
      isOpen={isOpen}
      onClose={onClose}
      title="Page layout"
      subtitle={`${pagination.pages.length} pages · ${manualBreakCount} manual breaks`}
      icon={Ruler}
      iconTone="accent"
      labelledById="page-layout-title"
      panelId="page-layout-panel"
      widthClassName="sm:max-w-[24rem] lg:w-[23rem]"
      footer={
        <div className="-mx-4 -my-3 bg-neutral-50 p-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setStatus(onInsertBreak() ? 'Page break inserted' : 'Move the cursor to a new position')}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white text-[11px] font-semibold text-neutral-700 shadow-sm hover:border-neutral-300 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
            >
              <FilePlus2 size={14} aria-hidden />
              Page break
            </button>
            <button
              type="button"
              onClick={onOpenPreview}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-neutral-900 text-[11px] font-semibold text-white shadow-sm hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
            >
              <Eye size={14} aria-hidden />
              Print preview
            </button>
          </div>
          <p className="mt-2 min-h-4 text-center text-[10px] text-neutral-500" role="status">{status}</p>
        </div>
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-5 border-b border-neutral-200 p-4">
          <PaperSelector
            layout={layout}
            onPaperChange={(paper) => onLayoutChange(setPaper(layout, paper))}
            onCustomSizeChange={(width, height) => onLayoutChange({
              ...layout,
              width: Math.min(600, Math.max(80, width)),
              height: Math.min(600, Math.max(80, height)),
            })}
          />
          <OrientationSelector
            value={layout.orientation}
            onChange={(orientation) => onLayoutChange({ ...layout, orientation })}
          />
          <MarginEditor
            margins={layout.margins}
            onPresetChange={(preset) => onLayoutChange(setMarginPreset(layout, preset))}
            onCustomChange={(margins) => onLayoutChange(setCustomMargins(layout, margins))}
          />
        </div>
        <div className="p-4">
          <HeaderFooterEditor
            header={layout.header}
            footer={layout.footer}
            pageNumber={layout.pageNumber}
            onHeaderChange={(header) => onLayoutChange({ ...layout, header })}
            onFooterChange={(footer) => onLayoutChange({ ...layout, footer })}
            onPageNumberChange={(pageNumber) => onLayoutChange({ ...layout, pageNumber })}
          />
        </div>
      </div>
    </PanelShell>
  )
}
