import { FileSearch2 } from 'lucide-react'
import { cn } from '../../lib/cn'

export function ContractToolbarControl({ isOpen, riskScore, onToggle }: { isOpen: boolean; riskScore?: number; onToggle: () => void }) {
  return <button id="contract-trigger" type="button" onClick={onToggle} aria-label={isOpen ? 'Close contract intelligence' : 'Open contract intelligence'} aria-expanded={isOpen} aria-controls="contract-panel" title="Contract intelligence" className={cn('relative flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35', isOpen ? 'bg-cyan-50 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100')}><FileSearch2 size={15} strokeWidth={1.9} aria-hidden />{riskScore !== undefined && <span className="absolute -right-1 -top-1 min-w-3.5 rounded-full bg-neutral-900 px-1 text-center text-[8px] font-bold leading-3.5 text-white dark:bg-white dark:text-neutral-950">{riskScore}</span>}</button>
}
