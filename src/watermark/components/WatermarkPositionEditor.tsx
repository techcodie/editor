import type { Watermark, WatermarkPosition, WatermarkRotation } from '../types/watermark'

interface WatermarkPositionEditorProps {
  watermark: Watermark
  disabled: boolean
  onChange: (watermark: Watermark) => void
}

const ROTATIONS: WatermarkRotation[] = [-90, -45, 0, 45, 90]

export function WatermarkPositionEditor({
  watermark,
  disabled,
  onChange,
}: WatermarkPositionEditorProps) {
  return (
    <fieldset disabled={disabled} className="space-y-3 disabled:opacity-50">
      <legend className="text-[11px] font-semibold text-neutral-900">Placement</legend>
      <label className="block text-[10px] font-medium text-neutral-500">
        Position
        <select
          value={watermark.position}
          onChange={(event) => onChange({
            ...watermark,
            position: event.target.value as WatermarkPosition,
          })}
          className="mt-1 h-9 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-xs text-neutral-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
        >
          <option value="center">Center</option>
          <option value="top-left">Top left</option>
          <option value="top-right">Top right</option>
          <option value="bottom-left">Bottom left</option>
          <option value="bottom-right">Bottom right</option>
          <option value="custom">Custom</option>
        </select>
      </label>
      {watermark.position === 'custom' && (
        <div className="grid grid-cols-2 gap-3">
          {(['x', 'y'] as const).map((axis) => (
            <label key={axis} className="text-[10px] font-medium uppercase text-neutral-500">
              {axis} {Math.round(watermark.customPosition[axis])}%
              <input
                type="range"
                min="0"
                max="100"
                value={watermark.customPosition[axis]}
                onChange={(event) => onChange({
                  ...watermark,
                  customPosition: {
                    ...watermark.customPosition,
                    [axis]: Number(event.target.value),
                  },
                })}
                className="mt-1 w-full accent-indigo-600"
              />
            </label>
          ))}
        </div>
      )}
      <label className="block text-[10px] font-medium text-neutral-500">
        Rotation
        <select
          value={watermark.rotation}
          onChange={(event) => onChange({
            ...watermark,
            rotation: Number(event.target.value) as WatermarkRotation,
          })}
          className="mt-1 h-9 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-xs text-neutral-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
        >
          {ROTATIONS.map((rotation) => (
            <option key={rotation} value={rotation}>{rotation}°</option>
          ))}
        </select>
      </label>
      <label className="block text-[10px] font-medium text-neutral-500">
        Scale {watermark.scale}%
        <input
          type="range"
          min="25"
          max="200"
          step="5"
          value={watermark.scale}
          onChange={(event) => onChange({ ...watermark, scale: Number(event.target.value) })}
          className="mt-1 w-full accent-indigo-600"
        />
      </label>
    </fieldset>
  )
}
