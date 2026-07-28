import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import * as Tooltip from '@radix-ui/react-tooltip'
import { ListChecks } from 'lucide-react'
import { cn } from '../../lib/cn'

interface FormBuilderToolbarControlProps { isOpen: boolean; fieldCount: number; onToggle: () => void }

export function FormBuilderToolbarControl({ isOpen, fieldCount, onToggle }: FormBuilderToolbarControlProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <ToolbarPrimitive.Button
          id="form-builder-trigger"
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? 'Close form builder' : 'Open form builder'}
          aria-expanded={isOpen}
          aria-controls="form-builder-panel"
          aria-pressed={isOpen}
          className={cn(
            'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-[background-color,color,transform] hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35',
            isOpen && 'bg-indigo-700 text-white hover:bg-indigo-600 hover:text-white',
          )}
        >
          <ListChecks size={16} strokeWidth={1.9} aria-hidden />
          {fieldCount > 0 && <span className="absolute -right-1 -top-1 min-w-3.5 rounded-full bg-emerald-600 px-0.5 text-center text-[8px] font-bold leading-3.5 text-white">{Math.min(99, fieldCount)}</span>}
        </ToolbarPrimitive.Button>
      </Tooltip.Trigger>
      <Tooltip.Portal><Tooltip.Content side="bottom" sideOffset={6} className="z-50 rounded-md bg-neutral-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg">Form builder<Tooltip.Arrow className="fill-neutral-900" /></Tooltip.Content></Tooltip.Portal>
    </Tooltip.Root>
  )
}
