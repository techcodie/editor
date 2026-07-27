import { RectangleHorizontal, RectangleVertical } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { PageOrientation } from '../types/layout'

interface OrientationSelectorProps {
  value: PageOrientation
  onChange: (orientation: PageOrientation) => void
}

export function OrientationSelector({ value, onChange }: OrientationSelectorProps) {
  return (
    <fieldset>
      <legend className="text-[11px] font-semibold text-neutral-900">Orientation</legend>
      <div className="mt-2 grid grid-cols-2 gap-1 rounded-md bg-neutral-100 p-1">
        {([
          ['portrait', RectangleVertical],
          ['landscape', RectangleHorizontal],
        ] as const).map(([orientation, Icon]) => (
          <button
            key={orientation}
            type="button"
            onClick={() => onChange(orientation)}
            aria-pressed={value === orientation}
            className={cn(
              'inline-flex h-8 items-center justify-center gap-1.5 rounded text-[11px] font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35',
              value === orientation ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-900',
            )}
          >
            <Icon size={14} aria-hidden />
            {orientation}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
