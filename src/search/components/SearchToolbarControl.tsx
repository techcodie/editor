import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Search } from 'lucide-react'
import { cn } from '../../lib/cn'

export function SearchToolbarControl({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <ToolbarPrimitive.Button id="semantic-search-trigger" type="button" onClick={onToggle} aria-label={isOpen ? 'Close semantic search' : 'Open semantic search'} aria-expanded={isOpen} aria-controls="semantic-search-panel" aria-pressed={isOpen} className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-[background-color,color,transform] hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 dark:hover:bg-neutral-800 dark:hover:text-neutral-100', isOpen && 'bg-indigo-700 text-white hover:bg-indigo-600 hover:text-white')}>
          <Search size={16} strokeWidth={1.9} aria-hidden />
        </ToolbarPrimitive.Button>
      </Tooltip.Trigger>
      <Tooltip.Portal><Tooltip.Content side="bottom" sideOffset={6} className="z-[110] rounded-md bg-neutral-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg">Semantic search<Tooltip.Arrow className="fill-neutral-900" /></Tooltip.Content></Tooltip.Portal>
    </Tooltip.Root>
  )
}
