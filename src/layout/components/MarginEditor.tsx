import type { MarginPreset, PageMargins } from '../types/layout'

interface MarginEditorProps {
  margins: PageMargins
  onPresetChange: (preset: MarginPreset) => void
  onCustomChange: (margins: Omit<PageMargins, 'preset'>) => void
}

export function MarginEditor({ margins, onPresetChange, onCustomChange }: MarginEditorProps) {
  return (
    <fieldset>
      <legend className="text-[11px] font-semibold text-neutral-900">Margins</legend>
      <select
        value={margins.preset}
        onChange={(event) => onPresetChange(event.target.value as MarginPreset)}
        className="mt-2 h-9 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-xs capitalize text-neutral-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
      >
        <option value="normal">Normal</option>
        <option value="narrow">Narrow</option>
        <option value="wide">Wide</option>
        <option value="custom">Custom</option>
      </select>
      {margins.preset === 'custom' && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <label key={side} className="text-[10px] font-medium capitalize text-neutral-500">
              {side} (mm)
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={margins[side]}
                onChange={(event) => onCustomChange({
                  top: margins.top,
                  right: margins.right,
                  bottom: margins.bottom,
                  left: margins.left,
                  [side]: Number(event.target.value),
                })}
                className="mt-1 h-8 w-full rounded-md border border-neutral-200 bg-white px-2 text-xs outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
              />
            </label>
          ))}
        </div>
      )}
    </fieldset>
  )
}
