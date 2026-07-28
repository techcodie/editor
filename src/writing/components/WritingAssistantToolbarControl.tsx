import { SpellCheck2 } from 'lucide-react'
import { cn } from '../../lib/cn'

export function WritingAssistantToolbarControl({ isOpen, score, onToggle }: { isOpen: boolean; score?: number; onToggle: () => void }) {
  return <button id="writing-assistant-trigger" type="button" onClick={onToggle} aria-label={isOpen ? 'Close writing assistant' : 'Open writing assistant'} aria-expanded={isOpen} aria-controls="writing-assistant-panel" title="Writing assistant" className={cn('relative flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35', isOpen ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100')}><SpellCheck2 size={15} strokeWidth={1.9} aria-hidden />{score !== undefined && <span className="absolute -right-1 -top-1 min-w-3.5 rounded-full bg-neutral-900 px-1 text-center text-[8px] font-bold leading-3.5 text-white dark:bg-white dark:text-neutral-950">{score}</span>}</button>
}
