import { Workflow } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { WorkflowStatus } from '../types/workflow'

interface WorkflowToolbarControlProps { isOpen: boolean; status?: WorkflowStatus; onToggle: () => void }

export function WorkflowToolbarControl({ isOpen, status, onToggle }: WorkflowToolbarControlProps) {
  return <button id="workflow-trigger" type="button" onClick={onToggle} aria-label={isOpen ? 'Close approval workflow' : 'Open approval workflow'} aria-expanded={isOpen} aria-controls="workflow-panel" title="Approval workflow" className={cn('relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 dark:hover:bg-neutral-800 dark:hover:text-neutral-100', isOpen && 'bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white dark:bg-white dark:text-neutral-950')}><Workflow size={14} strokeWidth={1.9} aria-hidden />{status && status !== 'draft' && <span className={cn('absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full ring-1 ring-white dark:ring-neutral-900', status === 'approved' ? 'bg-emerald-500' : status === 'rejected' ? 'bg-red-500' : status === 'changes-requested' ? 'bg-amber-500' : 'bg-blue-500')} />}</button>
}
