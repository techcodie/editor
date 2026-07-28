import { Camera, MessageSquareText } from 'lucide-react'
import { groupWorkflowHistory } from '../services/workflowHistory'
import type { WorkflowHistoryEntry } from '../types/approval'
import { StatusBadge } from './StatusBadge'

const actionLabel: Record<WorkflowHistoryEntry['action'], string> = {
  created: 'Workflow created',
  submitted: 'Submitted for review',
  approved: 'Approval recorded',
  rejected: 'Workflow rejected',
  'changes-requested': 'Changes requested',
  'stage-skipped': 'Stage skipped',
  'note-added': 'Review note added',
  'reviewer-assigned': 'Reviewer assigned',
  'reviewer-reassigned': 'Reviewer reassigned',
  'reviewer-removed': 'Reviewer removed',
  archived: 'Workflow archived',
  restored: 'Workflow restored',
}

export function WorkflowHistory({ entries }: { entries: WorkflowHistoryEntry[] }) {
  const groups = groupWorkflowHistory(entries)
  return (
    <section className="p-4" aria-label="Workflow history">
      {groups.map((group) => (
        <div key={group.id} className="mb-5 last:mb-0">
          <h3 className="mb-2 text-[9px] font-semibold uppercase text-neutral-400">{group.label}</h3>
          <ol className="list-none space-y-2">
            {group.entries.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="text-[10px] font-semibold text-neutral-900 dark:text-neutral-100">{actionLabel[entry.action]}</h4>
                      <StatusBadge status={entry.nextStatus} />
                    </div>
                    <p className="mt-0.5 text-[9px] text-neutral-500">{entry.actorName} / {new Date(entry.timestamp).toLocaleString()}</p>
                    {entry.stageName && <p className="mt-1 text-[9px] font-medium text-neutral-600 dark:text-neutral-300">{entry.stageName}</p>}
                    {entry.reason && <p className="mt-1 text-[9px] leading-4 text-neutral-600 dark:text-neutral-400">{entry.reason}</p>}
                    {entry.notes && <p className="mt-1 rounded bg-neutral-50 px-2 py-1.5 text-[9px] leading-4 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">{entry.notes}</p>}
                    <div className="mt-2 flex gap-3 text-[8px] font-medium text-neutral-400">
                      {entry.snapshotVersionId && <span className="flex items-center gap-1"><Camera size={9} aria-hidden />Snapshot saved</span>}
                      {entry.linkedCommentIds.length > 0 && <span className="flex items-center gap-1"><MessageSquareText size={9} aria-hidden />{entry.linkedCommentIds.length} linked</span>}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  )
}
