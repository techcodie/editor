import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react'
import { cn } from '../../lib/cn'
import type {
  HeaderFooterContent,
  PageAlignment,
  PageNumberSettings,
} from '../types/layout'

interface HeaderFooterEditorProps {
  header: HeaderFooterContent
  footer: HeaderFooterContent
  pageNumber: PageNumberSettings
  onHeaderChange: (header: HeaderFooterContent) => void
  onFooterChange: (footer: HeaderFooterContent) => void
  onPageNumberChange: (settings: PageNumberSettings) => void
}

function AlignmentControl({
  value,
  onChange,
  label,
}: {
  value: PageAlignment
  onChange: (value: PageAlignment) => void
  label: string
}) {
  return (
    <div className="flex rounded-md bg-neutral-100 p-0.5" aria-label={label}>
      {([
        ['left', AlignLeft],
        ['center', AlignCenter],
        ['right', AlignRight],
      ] as const).map(([alignment, Icon]) => (
        <button
          key={alignment}
          type="button"
          onClick={() => onChange(alignment)}
          aria-label={`${label}: ${alignment}`}
          aria-pressed={value === alignment}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35',
            value === alignment && 'bg-white text-neutral-950 shadow-sm',
          )}
        >
          <Icon size={13} aria-hidden />
        </button>
      ))}
    </div>
  )
}

function ContentRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: HeaderFooterContent
  onChange: (value: HeaderFooterContent) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-[11px] font-semibold text-neutral-900">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(event) => onChange({ ...value, enabled: event.target.checked })}
            className="h-3.5 w-3.5 accent-indigo-600"
          />
          {label}
        </label>
        <AlignmentControl
          value={value.alignment}
          onChange={(alignment) => onChange({ ...value, alignment })}
          label={`${label} alignment`}
        />
      </div>
      <input
        value={value.text}
        onChange={(event) => onChange({ ...value, text: event.target.value })}
        disabled={!value.enabled}
        placeholder={`${label} text`}
        className="mt-2 h-8 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-xs outline-none placeholder:text-neutral-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 disabled:bg-neutral-50 disabled:text-neutral-400"
      />
    </div>
  )
}

export function HeaderFooterEditor({
  header,
  footer,
  pageNumber,
  onHeaderChange,
  onFooterChange,
  onPageNumberChange,
}: HeaderFooterEditorProps) {
  return (
    <fieldset className="space-y-4">
      <legend className="sr-only">Headers, footers, and page numbers</legend>
      <ContentRow label="Header" value={header} onChange={onHeaderChange} />
      <ContentRow label="Footer" value={footer} onChange={onFooterChange} />
      <div>
        <label className="inline-flex items-center gap-2 text-[11px] font-semibold text-neutral-900">
          <input
            type="checkbox"
            checked={pageNumber.enabled}
            onChange={(event) => onPageNumberChange({ ...pageNumber, enabled: event.target.checked })}
            className="h-3.5 w-3.5 accent-indigo-600"
          />
          Page numbers
        </label>
        <div className="mt-2 flex items-center gap-2">
          <select
            value={pageNumber.position}
            disabled={!pageNumber.enabled}
            onChange={(event) => onPageNumberChange({
              ...pageNumber,
              position: event.target.value as PageNumberSettings['position'],
            })}
            aria-label="Page number position"
            className="h-8 min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2 text-[11px] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 disabled:bg-neutral-50"
          >
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
          </select>
          <AlignmentControl
            value={pageNumber.alignment}
            onChange={(alignment) => onPageNumberChange({ ...pageNumber, alignment })}
            label="Page number alignment"
          />
        </div>
        <label className="mt-2 inline-flex items-center gap-2 text-[10px] font-medium text-neutral-500">
          <input
            type="checkbox"
            checked={pageNumber.hideFirstPage}
            disabled={!pageNumber.enabled}
            onChange={(event) => onPageNumberChange({ ...pageNumber, hideFirstPage: event.target.checked })}
            className="h-3.5 w-3.5 accent-indigo-600"
          />
          Hide on first page
        </label>
      </div>
    </fieldset>
  )
}
