import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import * as Tooltip from '@radix-ui/react-tooltip'
import { FileDown } from 'lucide-react'
import { cn } from '../../lib/cn'

interface ExportToolbarControlProps {
  isOpen: boolean
  onToggle: () => void
}

export function ExportToolbarControl({ isOpen, onToggle }: ExportToolbarControlProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <ToolbarPrimitive.Button
          id="export-trigger"
          type="button"
          aria-label={isOpen ? 'Close export dialog' : 'Export document'}
          aria-expanded={isOpen}
          aria-controls="export-dialog"
          aria-pressed={isOpen}
          onClick={onToggle}
          className={cn(
            'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-[background-color,color,box-shadow,transform] duration-150 hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-1 focus-visible:ring-offset-white',
            isOpen && 'bg-indigo-700 text-white shadow-sm hover:bg-indigo-600 hover:text-white',
          )}
        >
          <FileDown size={16} strokeWidth={1.9} aria-hidden />
        </ToolbarPrimitive.Button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="bottom" sideOffset={6} className="z-[110] select-none rounded-md bg-neutral-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45)]">
          Export
          <Tooltip.Arrow className="fill-neutral-900" width={10} height={5} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
