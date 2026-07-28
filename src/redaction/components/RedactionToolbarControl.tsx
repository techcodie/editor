import { ScanEye } from 'lucide-react'
import { cn } from '../../lib/cn'

export function RedactionToolbarControl({ isOpen, count, onToggle }: { isOpen: boolean; count: number; onToggle: () => void }) {
  return <button id="redaction-trigger" type="button" onClick={onToggle} aria-label={isOpen ? 'Close redaction review' : 'Open redaction review'} aria-expanded={isOpen} aria-controls="redaction-panel" title="Sensitive data redaction" className={cn('relative flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35', isOpen ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100')}><ScanEye size={15} strokeWidth={1.9} aria-hidden />{count > 0 && <span className="absolute -right-1 -top-1 min-w-3.5 rounded-full bg-red-600 px-1 text-center text-[8px] font-bold leading-3.5 text-white">{Math.min(count, 99)}</span>}</button>
}
