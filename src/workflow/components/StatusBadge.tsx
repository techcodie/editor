import { cn } from '../../lib/cn'
import { workflowStatusLabel } from '../services/workflowHistory'
import type { ReviewerStatus } from '../types/approval'
import type { WorkflowStageStatus, WorkflowStatus } from '../types/workflow'

type Status = WorkflowStatus | WorkflowStageStatus | ReviewerStatus

const labels: Record<Status, string> = {
  draft: 'Draft',
  'in-review': 'In Review',
  'changes-requested': 'Changes Requested',
  approved: 'Approved',
  rejected: 'Rejected',
  archived: 'Archived',
  pending: 'Pending',
  active: 'Active',
  skipped: 'Skipped',
}

const styles: Record<Status, string> = {
  draft: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  'in-review': 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  'changes-requested': 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  rejected: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  archived: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
  pending: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
  active: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',
  skipped: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
}

interface StatusBadgeProps { status: Status; className?: string }

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = status in labels ? labels[status] : workflowStatusLabel(status as WorkflowStatus)
  return <span className={cn('inline-flex h-5 items-center rounded px-1.5 text-[8px] font-semibold uppercase', styles[status], className)}>{label}</span>
}
