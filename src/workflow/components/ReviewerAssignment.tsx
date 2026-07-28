import { useState } from 'react'
import { Plus, UsersRound } from 'lucide-react'
import type { Workflow } from '../types/workflow'
import { ApprovalCard } from './ApprovalCard'

interface ReviewerAssignmentProps {
  workflow: Workflow
  busy: boolean
  onAssign: (stageId: string, name: string) => void
  onRemove: (reviewerId: string) => void
  onReassign: (reviewerId: string, stageId: string) => void
  onNotes: (reviewerId: string, notes: string) => void
}

export function ReviewerAssignment({ workflow, busy, onAssign, onRemove, onReassign, onNotes }: ReviewerAssignmentProps) {
  const [name, setName] = useState('')
  const [stageId, setStageId] = useState(workflow.stages[0]?.id ?? '')
  const editable = workflow.status === 'draft' && !busy
  const stageFor = (reviewerId: string) => workflow.stages.find((stage) => stage.reviewerIds.includes(reviewerId))?.id ?? ''
  return <section className="space-y-3 p-4"><div><h3 className="flex items-center gap-2 text-xs font-semibold text-neutral-950 dark:text-neutral-100"><UsersRound size={14} aria-hidden />Reviewers</h3><p className="mt-1 text-[10px] leading-4 text-neutral-500">Assign reviewers to one stage at a time. Reviewer identity is local in Phase 1.</p></div>{editable && <div className="grid grid-cols-[1fr_1fr_auto] gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 dark:border-neutral-800 dark:bg-neutral-900"><label><span className="sr-only">Reviewer name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Reviewer name" className="h-8 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-[10px] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 dark:border-neutral-700 dark:bg-neutral-950" /></label><label><span className="sr-only">Reviewer stage</span><select value={stageId} onChange={(event) => setStageId(event.target.value)} aria-label="Reviewer stage" className="h-8 w-full rounded-md border border-neutral-200 bg-white px-2 text-[10px] outline-none focus:border-indigo-300 dark:border-neutral-700 dark:bg-neutral-950">{workflow.stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></label><button type="button" onClick={() => { if (!name.trim() || !stageId) return; onAssign(stageId, name); setName('') }} disabled={!name.trim() || !stageId} aria-label="Assign reviewer" className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:bg-white dark:text-neutral-950"><Plus size={13} aria-hidden /></button></div>}<div className="space-y-2">{workflow.reviewers.map((reviewer) => <ApprovalCard key={reviewer.id} reviewer={reviewer} stages={workflow.stages} stageId={stageFor(reviewer.id)} editable={editable} onReassign={(nextStage) => onReassign(reviewer.id, nextStage)} onNotes={(notes) => onNotes(reviewer.id, notes)} onRemove={() => onRemove(reviewer.id)} />)}</div>{workflow.reviewers.length === 0 && <div className="rounded-lg border border-dashed border-neutral-200 px-5 py-8 text-center text-[10px] text-neutral-500 dark:border-neutral-800">Assign a reviewer before submitting this workflow.</div>}</section>
}
