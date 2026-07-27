import { normalizePageRange } from '../services/watermarkEngine'
import type { Watermark, WatermarkApplyMode } from '../types/watermark'

interface PageAssignmentProps {
  watermark: Watermark
  pageCount: number
  currentPage: number
  onChange: (watermark: Watermark) => void
}

export function PageAssignment({
  watermark,
  pageCount,
  currentPage,
  onChange,
}: PageAssignmentProps) {
  const updateRange = (field: 'start' | 'end', value: number) => {
    const pageRange = normalizePageRange(
      { ...watermark.pageRange, [field]: value },
      pageCount,
    )
    onChange({ ...watermark, pageRange })
  }

  return (
    <fieldset>
      <legend className="text-[11px] font-semibold text-neutral-900">Apply to</legend>
      <select
        value={watermark.applyMode}
        onChange={(event) => onChange({
          ...watermark,
          applyMode: event.target.value as WatermarkApplyMode,
        })}
        className="mt-2 h-9 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-xs text-neutral-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
      >
        <option value="document">Entire document</option>
        <option value="current-page">Current page ({currentPage})</option>
        <option value="page-range">Custom page range</option>
        <option value="even-pages">Even pages</option>
        <option value="odd-pages">Odd pages</option>
      </select>
      {watermark.applyMode === 'page-range' && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="text-[10px] font-medium text-neutral-500">
            From
            <input
              type="number"
              min="1"
              max={pageCount}
              value={watermark.pageRange.start}
              onChange={(event) => updateRange('start', Number(event.target.value))}
              className="mt-1 h-8 w-full rounded-md border border-neutral-200 px-2 text-xs outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
            />
          </label>
          <label className="text-[10px] font-medium text-neutral-500">
            To
            <input
              type="number"
              min={watermark.pageRange.start}
              max={pageCount}
              value={watermark.pageRange.end}
              onChange={(event) => updateRange('end', Number(event.target.value))}
              className="mt-1 h-8 w-full rounded-md border border-neutral-200 px-2 text-xs outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
            />
          </label>
        </div>
      )}
    </fieldset>
  )
}
