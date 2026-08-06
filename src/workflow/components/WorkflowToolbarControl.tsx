import { Workflow } from 'lucide-react'
import { ToolbarButton } from '../../components/Toolbar/ToolbarButton'
import { cn } from '../../lib/cn'
import type { WorkflowStatus } from '../types/workflow'

interface WorkflowToolbarControlProps { isOpen: boolean; status?: WorkflowStatus; onToggle: () => void }

export function WorkflowToolbarControl({ isOpen, status, onToggle }: WorkflowToolbarControlProps) {
  return (
    <ToolbarButton
      id="workflow-trigger"
      icon={Workflow}
      label={isOpen ? 'Close approval workflow' : 'Open approval workflow'}
      isActive={isOpen}
      ariaExpanded={isOpen}
      ariaControls="workflow-panel"
      onClick={onToggle}
      badge={
        status && status !== 'draft' ? (
          <span
            aria-hidden
            className={cn(
              'block h-2 w-2 rounded-full ring-2 ring-white',
              status === 'approved'
                ? 'bg-emerald-500'
                : status === 'rejected'
                  ? 'bg-red-500'
                  : status === 'changes-requested'
                    ? 'bg-amber-500'
                    : 'bg-blue-500',
            )}
          />
        ) : undefined
      }
    />
  )
}
