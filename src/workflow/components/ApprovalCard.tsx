import { MessageSquareText, Trash2, UserRound } from 'lucide-react'
import type { ApprovalReviewer } from '../types/approval'
import type { WorkflowStage } from '../types/workflow'
import { StatusBadge } from './StatusBadge'

interface ApprovalCardProps {
  reviewer: ApprovalReviewer
  stages: WorkflowStage[]
  stageId: string
  editable: boolean
  onReassign: (stageId: string) => void
  onNotes: (notes: string) => void
  onRemove: () => void
}

export function ApprovalCard({ reviewer, stages, stageId, editable, onReassign, onNotes, onRemove }: ApprovalCardProps) {
  return <article className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300"><UserRound size={13} aria-hidden /></span><div className="min-w-0 flex-1"><h4 className="truncate text-[11px] font-semibold text-neutral-900 dark:text-neutral-100">{reviewer.name}</h4><p className="text-[9px] text-neutral-400">Assigned {new Date(reviewer.assignedAt).toLocaleDateString()}</p></div><StatusBadge status={reviewer.status} />{editable && <button type="button" onClick={onRemove} aria-label={`Remove ${reviewer.name}`} className="flex h-7 w-7 items-center justify-center rounded text-neutral-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"><Trash2 size={12} aria-hidden /></button>}</div><div className="mt-2 grid gap-2 sm:grid-cols-2"><label><span className="text-[8px] font-semibold uppercase text-neutral-400">Stage</span><select value={stageId} onChange={(event) => onReassign(event.target.value)} disabled={!editable} aria-label={`Stage for ${reviewer.name}`} className="mt-1 h-8 w-full rounded-md border border-neutral-200 bg-white px-2 text-[10px] outline-none disabled:bg-neutral-50 disabled:text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900"><option value="">Unassigned</option>{stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></label><label><span className="flex items-center gap-1 text-[8px] font-semibold uppercase text-neutral-400"><MessageSquareText size={9} aria-hidden />Reviewer notes</span><input value={reviewer.notes} onChange={(event) => onNotes(event.target.value)} disabled={!editable} placeholder="Optional notes" aria-label={`Notes for ${reviewer.name}`} className="mt-1 h-8 w-full rounded-md border border-neutral-200 px-2 text-[10px] outline-none disabled:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900" /></label></div></article>
}
