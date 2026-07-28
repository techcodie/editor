import { memo } from 'react'
import { Check, Circle, Clock3, SkipForward, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { ApprovalReviewer } from '../types/approval'
import type { WorkflowStage } from '../types/workflow'
import { StatusBadge } from './StatusBadge'

interface WorkflowTimelineProps {
  stages: WorkflowStage[]
  reviewers: ApprovalReviewer[]
  currentStage: number
}

function StageIcon({ status }: { status: WorkflowStage['status'] }) {
  if (status === 'approved') return <Check size={12} aria-hidden />
  if (status === 'rejected') return <X size={12} aria-hidden />
  if (status === 'skipped') return <SkipForward size={11} aria-hidden />
  if (status === 'active') return <Clock3 size={11} aria-hidden />
  return <Circle size={9} aria-hidden />
}

function WorkflowTimelineComponent({ stages, reviewers, currentStage }: WorkflowTimelineProps) {
  const reviewersById = new Map(reviewers.map((reviewer) => [reviewer.id, reviewer]))
  return (
    <ol className="list-none space-y-0" aria-label="Approval stages">
      {stages.map((stage, index) => (
        <li key={stage.id} className="relative flex gap-3 pb-4 last:pb-0">
          {index < stages.length - 1 && <span className="absolute left-[13px] top-7 h-[calc(100%-1rem)] w-px bg-neutral-200 dark:bg-neutral-800" />}
          <span className={cn(
            'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border',
            stage.status === 'active' || index === currentStage
              ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
              : stage.status === 'approved'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : stage.status === 'rejected'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-neutral-200 bg-white text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900',
          )}><StageIcon status={stage.status} /></span>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-2">
              <h4 className="truncate text-[11px] font-semibold text-neutral-900 dark:text-neutral-100">{stage.name}</h4>
              <StatusBadge status={stage.status} />
            </div>
            {stage.description && <p className="mt-1 text-[9px] leading-4 text-neutral-500 dark:text-neutral-400">{stage.description}</p>}
            <p className="mt-1 text-[9px] text-neutral-400">
              {stage.reviewerIds.length ? stage.reviewerIds.map((id) => reviewersById.get(id)?.name).filter(Boolean).join(', ') : 'No reviewers assigned'}
              {stage.dueDate ? ` / Due ${new Date(`${stage.dueDate}T00:00:00`).toLocaleDateString()}` : ''}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export const WorkflowTimeline = memo(WorkflowTimelineComponent)
