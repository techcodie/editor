import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Building2, FileCode2, Image as ImageIcon, Stamp, Trash2, Type } from 'lucide-react'
import { cn } from '../../lib/cn'
import { PanelShell } from '../../components/ui/PanelShell'
import type { Watermark, WatermarkType } from '../types/watermark'
import { WatermarkEditor } from './WatermarkEditor'
import { WatermarkPreview } from './WatermarkPreview'

interface WatermarkToolbarControlProps {
  isOpen: boolean
  hasWatermark: boolean
  onToggle: () => void
}

export function WatermarkToolbarControl({
  isOpen,
  hasWatermark,
  onToggle,
}: WatermarkToolbarControlProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <ToolbarPrimitive.Button
          id="watermark-trigger"
          type="button"
          aria-label={isOpen ? 'Close watermark panel' : 'Open watermark panel'}
          aria-controls="watermark-panel"
          aria-expanded={isOpen}
          aria-pressed={isOpen}
          onClick={onToggle}
          className={cn(
            'relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-[background-color,color,box-shadow,transform] duration-150 hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-white',
            isOpen && 'bg-indigo-700 text-white shadow-sm hover:bg-indigo-600 hover:text-white',
          )}
        >
          <Stamp size={16} strokeWidth={1.9} aria-hidden />
          {hasWatermark && !isOpen && (
            <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-indigo-600 ring-1 ring-white" />
          )}
        </ToolbarPrimitive.Button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="bottom" sideOffset={6} className="z-50 select-none rounded-md bg-neutral-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45)]">
          Watermark
          <Tooltip.Arrow className="fill-neutral-900" width={10} height={5} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

interface WatermarkPanelProps {
  isOpen: boolean
  watermark: Watermark | null
  pageCount: number
  currentPage: number
  onAdd: (type: WatermarkType) => void
  onChange: (watermark: Watermark) => void
  onRemove: () => void
  onClose: () => void
}

const WATERMARK_TYPES = [
  { type: 'text', label: 'Text', Icon: Type },
  { type: 'image', label: 'Image', Icon: ImageIcon },
  { type: 'logo', label: 'Company logo', Icon: Building2 },
  { type: 'svg', label: 'SVG', Icon: FileCode2 },
] as const

const WATERMARK_TYPE_LABELS: Record<WatermarkType, string> = {
  text: 'Text',
  image: 'Image',
  logo: 'Company logo',
  svg: 'SVG',
}

const APPLY_MODE_LABELS: Record<Watermark['applyMode'], string> = {
  document: 'Entire document',
  'current-page': 'Current page',
  'page-range': 'Page range',
  'even-pages': 'Even pages',
  'odd-pages': 'Odd pages',
}

export function WatermarkPanel({
  isOpen,
  watermark,
  pageCount,
  currentPage,
  onAdd,
  onChange,
  onRemove,
  onClose,
}: WatermarkPanelProps) {
  return (
    <PanelShell
      isOpen={isOpen}
      onClose={onClose}
      title="Watermark"
      subtitle={
        watermark
          ? `${WATERMARK_TYPE_LABELS[watermark.type]} · ${APPLY_MODE_LABELS[watermark.applyMode]}`
          : 'No watermark applied'
      }
      icon={Stamp}
      iconTone="accent"
      labelledById="watermark-panel-title"
      panelId="watermark-panel"
      widthClassName="sm:max-w-[24rem] lg:w-[23rem]"
      footer={watermark ? (
        <div className="-mx-4 -my-3 bg-neutral-50 p-3">
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-white text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
          >
            <Trash2 size={14} aria-hidden />
            Remove watermark
          </button>
        </div>
      ) : undefined}
    >
      {watermark ? (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <WatermarkPreview watermark={watermark} />
          <WatermarkEditor
            watermark={watermark}
            pageCount={pageCount}
            currentPage={currentPage}
            onChange={onChange}
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-400">
            <Stamp size={21} strokeWidth={1.6} aria-hidden />
          </span>
          <h3 className="mt-4 text-sm font-semibold text-neutral-950">Add a watermark</h3>
          <p className="mt-1 max-w-64 text-xs leading-5 text-neutral-500">
            Nothing is applied to the document pages.
          </p>
          <div className="mt-5 grid w-full grid-cols-2 gap-2">
            {WATERMARK_TYPES.map(({ type, label, Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => onAdd(type)}
                className="flex h-20 flex-col items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white text-[11px] font-semibold text-neutral-700 shadow-sm transition-[border-color,box-shadow] hover:border-neutral-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
              >
                <Icon size={17} strokeWidth={1.8} className="text-neutral-400" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </PanelShell>
  )
}
