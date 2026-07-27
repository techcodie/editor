import type { PageLayout, PaperSize } from '../types/layout'
import { paperLabel } from '../services/pageMetrics'

interface PaperSelectorProps {
  layout: PageLayout
  onPaperChange: (paper: PaperSize) => void
  onCustomSizeChange: (width: number, height: number) => void
}

const PAPERS: PaperSize[] = ['a4', 'a5', 'a3', 'letter', 'legal', 'executive', 'custom']

export function PaperSelector({
  layout,
  onPaperChange,
  onCustomSizeChange,
}: PaperSelectorProps) {
  return (
    <fieldset>
      <legend className="text-[11px] font-semibold text-neutral-900">Paper</legend>
      <select
        value={layout.paper}
        onChange={(event) => onPaperChange(event.target.value as PaperSize)}
        className="mt-2 h-9 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-xs text-neutral-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
      >
        {PAPERS.map((paper) => <option key={paper} value={paper}>{paperLabel(paper)}</option>)}
      </select>
      {layout.paper === 'custom' && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(['width', 'height'] as const).map((field) => (
            <label key={field} className="text-[10px] font-medium capitalize text-neutral-500">
              {field} (mm)
              <input
                type="number"
                min="80"
                max="600"
                step="1"
                value={layout[field]}
                onChange={(event) => onCustomSizeChange(
                  field === 'width' ? Number(event.target.value) : layout.width,
                  field === 'height' ? Number(event.target.value) : layout.height,
                )}
                className="mt-1 h-8 w-full rounded-md border border-neutral-200 bg-white px-2 text-xs outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
              />
            </label>
          ))}
        </div>
      )}
    </fieldset>
  )
}
