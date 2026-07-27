import { ShieldCheck } from 'lucide-react'
import { cn } from '../../lib/cn'

interface ComplianceToolbarControlProps { isOpen: boolean; onToggle: () => void }

export function ComplianceToolbarControl({ isOpen, onToggle }: ComplianceToolbarControlProps) {
  return <button id="compliance-trigger" type="button" onClick={onToggle} aria-label={isOpen ? 'Close compliance analysis' : 'Open compliance analysis'} aria-expanded={isOpen} aria-controls="compliance-panel" title="Compliance analysis" className={cn('flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35', isOpen ? 'bg-indigo-50 text-indigo-700' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900')}><ShieldCheck size={15} strokeWidth={1.9} aria-hidden /></button>
}
