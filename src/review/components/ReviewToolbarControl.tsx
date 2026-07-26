import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import * as Tooltip from '@radix-ui/react-tooltip'
import { MessagesSquare } from 'lucide-react'
import { cn } from '../../lib/cn'

interface ReviewToolbarControlProps {
  isActive: boolean
  onToggle: () => void
}

export function ReviewToolbarControl({
  isActive,
  onToggle,
}: ReviewToolbarControlProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <ToolbarPrimitive.Button
          id="review-mode-trigger"
          type="button"
          aria-label={isActive ? 'Exit Review Mode' : 'Enter Review Mode'}
          aria-controls="review-sidebar"
          aria-expanded={isActive}
          aria-pressed={isActive}
          onClick={onToggle}
          className={cn(
            'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-[background-color,color,box-shadow,transform] duration-150 hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-1 focus-visible:ring-offset-white',
            isActive && 'bg-neutral-900 text-white shadow-sm hover:bg-neutral-800 hover:text-white',
          )}
        >
          <MessagesSquare size={16} strokeWidth={1.9} aria-hidden />
        </ToolbarPrimitive.Button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="bottom" sideOffset={6} className="z-50 select-none rounded-md bg-neutral-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45)] [animation:toolbar-tooltip-in_120ms_ease-out]">
          Review Mode
          <Tooltip.Arrow className="fill-neutral-900" width={10} height={5} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
