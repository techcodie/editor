import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import * as Tooltip from '@radix-ui/react-tooltip'
import { History } from 'lucide-react'
import { cn } from '../../lib/cn'

interface HistoryToolbarControlProps {
  isOpen: boolean
  versionCount: number
  onToggle: () => void
}

export function HistoryToolbarControl({ isOpen, versionCount, onToggle }: HistoryToolbarControlProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <ToolbarPrimitive.Button
          id="history-trigger"
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? 'Close version history' : 'Open version history'}
          aria-expanded={isOpen}
          aria-controls="history-panel"
          aria-pressed={isOpen}
          className={cn(
            'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-[background-color,color,transform] hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35',
            isOpen && 'bg-indigo-700 text-white hover:bg-indigo-600 hover:text-white',
          )}
        >
          <History size={16} strokeWidth={1.9} aria-hidden />
          {versionCount > 0 && (
            <span className="absolute -right-1 -top-1 min-w-3.5 rounded-full bg-neutral-900 px-0.5 text-center text-[8px] font-bold leading-3.5 text-white">
              {Math.min(99, versionCount)}
            </span>
          )}
        </ToolbarPrimitive.Button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="bottom" sideOffset={6} className="z-50 rounded-md bg-neutral-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg">
          Version history<Tooltip.Arrow className="fill-neutral-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
