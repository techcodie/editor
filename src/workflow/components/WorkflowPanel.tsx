import { lazy, Suspense, useState } from 'react'
import { Archive, Check, Download, FileCheck2, LoaderCircle, MessageSquarePlus, Plus, RotateCcw, Send, SkipForward, Trash2, UserRoundCheck, X } from 'lucide-react'
import type { EditorApi } from '../../lib/editor-api'
import type { ContractAnalysis } from '../../contract/types/contract'
import type { Comment, CommentAuthor } from '../../review/types/comment'
import { PanelShell } from '../../components/ui/PanelShell'
import { useWorkflow } from '../hooks/useWorkflow'
import { serializeWorkflow } from '../services/workflowSerializer'
import type { ApprovalDecision } from '../types/approval'
import type { Workflow } from '../types/workflow'
import type { IdentityAuditInput } from '../../identity/types/identity'
import { ApprovalDialog, type ApprovalDialogMode } from './ApprovalDialog'
import { ApprovalSidebar } from './ApprovalSidebar'
import { ReviewerAssignment } from './ReviewerAssignment'
import { StatusBadge } from './StatusBadge'
import { WorkflowTimeline } from './WorkflowTimeline'

const WorkflowHistory = lazy(async () => {
  const module = await import('./WorkflowHistory')
  return { default: module.WorkflowHistory }
})

interface WorkflowPanelProps {
  isOpen: boolean
  api: EditorApi | null
  author: CommentAuthor
  namespace: string
  unresolvedSuggestions: number
  comments: Comment[]
  onClose: () => void
  onChange: (workflow: Workflow | null) => void
  contractAnalysis?: ContractAnalysis | null
  canApprove?: boolean
  onAudit?: (input: IdentityAuditInput) => void
}

type PanelTab = 'overview' | 'reviewers' | 'history'

function downloadWorkflow(workflow: Workflow) {
  const blob = new Blob([serializeWorkflow(workflow)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${workflow.name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'workflow'}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function WorkflowPanel({ isOpen, api, author, namespace, unresolvedSuggestions, comments, onClose, onChange, contractAnalysis, canApprove = true, onAudit }: WorkflowPanelProps) {
  const [tab, setTab] = useState<PanelTab>('overview')
  const [dialog, setDialog] = useState<ApprovalDialogMode | null>(null)
  const [newName, setNewName] = useState('Document approval')
  const workflowState = useWorkflow({ active: isOpen, api, namespace, author, unresolvedSuggestions, onChange, contractAnalysis, onAudit })
  const { workflow, currentStage, stageReviewers, loaded, saving, error, validation } = workflowState

  const submitDialog = async (value: { actorId: string; actorName: string; reason: string; notes: string; linkedCommentIds: string[] }) => {
    if (!dialog) return
    const succeeded = dialog === 'note'
      ? await workflowState.addNote(value.notes, value.linkedCommentIds)
      : await workflowState.decide(dialog as ApprovalDecision, value)
    if (succeeded) setDialog(null)
  }

  return (
    <PanelShell
      isOpen={isOpen}
      onClose={onClose}
      onEscape={() => { if (!dialog) onClose() }}
      initialFocusSelector='[aria-label="Close approval workflow"]'
      title="Approval workflow"
      subtitle={workflow ? workflow.name : 'Document review and decisions'}
      icon={FileCheck2}
      iconTone="accent"
      labelledById="workflow-panel-title"
      panelId="workflow-panel"
      className="workflow-panel"
      widthClassName="sm:max-w-[30rem] lg:w-[29rem]"
      headerActions={workflow && <button type="button" onClick={() => downloadWorkflow(workflow)} aria-label="Export workflow audit" title="Export workflow" className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] dark:hover:bg-neutral-800"><Download size={14} aria-hidden /></button>}
      footer={loaded && workflow ? (
        <div className="-mx-4 -my-3 bg-neutral-50 p-3 dark:bg-neutral-900">
          <div className="flex flex-wrap items-center gap-1.5">
            {workflow.status === 'draft' && <button type="button" onClick={() => void workflowState.submit()} disabled={saving || !validation.valid} className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-neutral-900 px-3 text-[10px] font-semibold text-white hover:bg-neutral-800 disabled:opacity-40 dark:bg-white dark:text-neutral-950"><Send size={12} aria-hidden />Submit for review</button>}
            {workflow.status === 'changes-requested' && <button type="button" onClick={() => void workflowState.submit('Revisions submitted for review.')} disabled={saving || !validation.valid} className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-neutral-900 px-3 text-[10px] font-semibold text-white hover:bg-neutral-800 disabled:opacity-40 dark:bg-white dark:text-neutral-950"><RotateCcw size={12} aria-hidden />Resubmit</button>}
            {workflow.status === 'in-review' && <><button type="button" onClick={() => setDialog('approve')} disabled={!canApprove || saving || stageReviewers.length === 0 || !validation.valid} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-md bg-emerald-600 px-2 text-[9px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"><Check size={11} aria-hidden />Approve</button><button type="button" onClick={() => setDialog('request-changes')} disabled={!canApprove || saving || stageReviewers.length === 0} className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-[9px] font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200">Changes</button><button type="button" onClick={() => setDialog('reject')} disabled={!canApprove || saving || stageReviewers.length === 0} className="h-8 rounded-md border border-red-200 bg-white px-2 text-[9px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40 dark:bg-neutral-950">Reject</button><button type="button" onClick={() => setDialog('skip-stage')} disabled={!canApprove || saving} aria-label="Skip current stage" title="Skip stage" className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-950"><SkipForward size={12} aria-hidden /></button></>}
            {workflow.status === 'archived' ? <button type="button" onClick={() => void workflowState.restore()} disabled={saving} className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-neutral-900 text-[10px] font-semibold text-white hover:bg-neutral-800 disabled:opacity-40 dark:bg-white dark:text-neutral-950"><RotateCcw size={12} aria-hidden />Restore workflow</button> : <button type="button" onClick={() => setDialog('note')} disabled={saving} aria-label="Add workflow note" title="Add note" className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-950"><MessageSquarePlus size={12} aria-hidden /></button>}
            {['approved', 'rejected'].includes(workflow.status) && <button type="button" onClick={() => void workflowState.archive()} disabled={saving} className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-neutral-200 bg-white text-[10px] font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300"><Archive size={12} aria-hidden />Archive</button>}
          </div>
          <div className="mt-2 flex items-center justify-between gap-3"><div className="flex items-center gap-2">{currentStage && <span className="truncate text-[9px] text-neutral-500">Stage {workflow.currentStage + 1}: {currentStage.name}</span>}<StatusBadge status={workflow.status} /></div>{['draft', 'archived'].includes(workflow.status) && <button type="button" onClick={() => { if (window.confirm('Delete this local workflow and its audit timeline?')) void workflowState.remove() }} disabled={saving} className="text-[9px] font-medium text-neutral-400 hover:text-red-600">Delete</button>}</div>
        </div>
      ) : undefined}
    >
      {error && <div role="alert" className="flex items-center gap-2 border-b border-red-100 bg-red-50 px-4 py-2 text-[10px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"><span className="min-w-0 flex-1">{error}</span><button type="button" onClick={workflowState.clearError} aria-label="Dismiss workflow error" className="flex h-5 w-5 items-center justify-center rounded hover:bg-red-100 dark:hover:bg-red-900"><X size={11} aria-hidden /></button></div>}
      {!loaded ? <div className="flex min-h-0 flex-1 items-center justify-center" role="status"><LoaderCircle size={18} className="animate-spin text-neutral-400" aria-hidden /><span className="sr-only">Loading approval workflow</span></div> : !workflow ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-6"><div className="w-full max-w-xs text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900"><UserRoundCheck size={19} aria-hidden /></span><h3 className="mt-4 text-sm font-semibold text-neutral-950 dark:text-neutral-100">Start an approval workflow</h3><p className="mt-1 text-[10px] leading-5 text-neutral-500">Configure review stages, assign reviewers, and preserve every decision in the audit timeline.</p><label className="mt-4 block text-left"><span className="text-[9px] font-semibold text-neutral-600 dark:text-neutral-300">Workflow name</span><input value={newName} onChange={(event) => setNewName(event.target.value)} maxLength={120} className="mt-1 h-9 w-full rounded-md border border-neutral-200 px-2.5 text-[11px] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 dark:border-neutral-700 dark:bg-neutral-900" /></label><button type="button" onClick={() => void workflowState.create(newName)} disabled={saving || !newName.trim()} className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-neutral-900 text-[11px] font-semibold text-white hover:bg-neutral-800 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200">{saving ? <LoaderCircle size={13} className="animate-spin" aria-hidden /> : <Plus size={13} aria-hidden />}Create workflow</button></div></div>
      ) : (
        <>
          <nav className="grid shrink-0 grid-cols-3 border-b border-neutral-200 bg-neutral-50 p-1.5 dark:border-neutral-800 dark:bg-neutral-900" aria-label="Workflow views">{(['overview', 'reviewers', 'history'] as const).map((item) => <button key={item} type="button" onClick={() => setTab(item)} aria-pressed={tab === item} className={`h-8 rounded text-[10px] font-semibold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] ${tab === item ? 'bg-white text-neutral-950 shadow-sm dark:bg-neutral-800 dark:text-white' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>{item}</button>)}</nav>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {tab === 'overview' && <><ApprovalSidebar workflow={workflow} validation={validation} busy={saving} onPolicyChange={(patch) => void workflowState.setPolicy(patch)} /><section className="border-t border-neutral-200 p-4 dark:border-neutral-800"><div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-semibold text-neutral-950 dark:text-neutral-100">Review stages</h3>{workflow.status === 'draft' && <button type="button" onClick={() => void workflowState.addStage()} disabled={saving} className="flex h-7 items-center gap-1 rounded-md px-2 text-[9px] font-semibold text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:text-neutral-300 dark:hover:bg-neutral-800"><Plus size={11} aria-hidden />Add stage</button>}</div>{workflow.status === 'draft' ? <div className="space-y-2">{workflow.stages.map((stage, index) => <article key={stage.id} className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"><div className="flex items-center gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-neutral-100 text-[9px] font-semibold text-neutral-500 dark:bg-neutral-800">{index + 1}</span><input defaultValue={stage.name} onBlur={(event) => void workflowState.updateStage(stage.id, { name: event.target.value })} aria-label={`Name for stage ${index + 1}`} className="h-7 min-w-0 flex-1 rounded border border-transparent px-1.5 text-[10px] font-semibold outline-none hover:border-neutral-200 focus:border-indigo-300 dark:bg-neutral-950" />{workflow.stages.length > 1 && <button type="button" onClick={() => void workflowState.removeStage(stage.id)} disabled={saving} aria-label={`Delete ${stage.name}`} className="flex h-7 w-7 items-center justify-center rounded text-neutral-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"><Trash2 size={11} aria-hidden /></button>}</div><textarea defaultValue={stage.description} onBlur={(event) => void workflowState.updateStage(stage.id, { description: event.target.value })} aria-label={`Description for ${stage.name}`} rows={2} placeholder="Stage description" className="mt-2 w-full resize-none rounded-md border border-neutral-200 p-2 text-[9px] leading-4 outline-none focus:border-indigo-300 dark:border-neutral-700 dark:bg-neutral-900" /><label className="mt-2 flex items-center gap-2 text-[9px] text-neutral-500"><span className="font-semibold">Due date</span><input type="date" defaultValue={stage.dueDate} onChange={(event) => void workflowState.updateStage(stage.id, { dueDate: event.target.value })} className="h-7 rounded-md border border-neutral-200 px-2 text-[9px] outline-none focus:border-indigo-300 dark:border-neutral-700 dark:bg-neutral-900" /></label></article>)}</div> : <WorkflowTimeline stages={workflow.stages} reviewers={workflow.reviewers} currentStage={workflow.currentStage} />}</section></>}
            {tab === 'reviewers' && <ReviewerAssignment workflow={workflow} busy={saving} onAssign={(stageId, name) => void workflowState.assignReviewer(stageId, name)} onRemove={(reviewerId) => void workflowState.removeReviewer(reviewerId)} onReassign={(reviewerId, stageId) => void workflowState.reassignReviewer(reviewerId, stageId)} onNotes={(reviewerId, notes) => void workflowState.updateReviewerNotes(reviewerId, notes)} />}
            {tab === 'history' && <Suspense fallback={<div className="flex h-40 items-center justify-center" role="status"><LoaderCircle size={16} className="animate-spin text-neutral-400" aria-hidden /><span className="sr-only">Loading workflow history</span></div>}><WorkflowHistory entries={workflow.history} /></Suspense>}
          </div>
        </>
      )}
      {dialog && workflow && <ApprovalDialog mode={dialog} reviewers={stageReviewers} comments={comments} author={author} busy={saving} onSubmit={(value) => void submitDialog(value)} onCancel={() => { if (!saving) setDialog(null) }} />}
    </PanelShell>
  )
}
