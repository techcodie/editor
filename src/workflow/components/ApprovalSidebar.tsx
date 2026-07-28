import { AlertTriangle, CheckCircle2, LoaderCircle, ShieldCheck } from 'lucide-react'
import type { Workflow, WorkflowValidation } from '../types/workflow'
import { StatusBadge } from './StatusBadge'

interface ApprovalSidebarProps {
  workflow: Workflow
  validation: WorkflowValidation
  busy: boolean
  onPolicyChange: (patch: Partial<Workflow['metadata']>) => void
}

export function ApprovalSidebar({ workflow, validation, busy, onPolicyChange }: ApprovalSidebarProps) {
  return (
    <section className="space-y-4 p-4" aria-label="Workflow summary">
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-semibold uppercase text-neutral-400">Current status</p>
            <p className="mt-1 text-xs font-semibold text-neutral-950 dark:text-neutral-100">{workflow.name}</p>
          </div>
          <StatusBadge status={workflow.status} />
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-neutral-200 pt-3 text-center dark:border-neutral-800">
          <div><dt className="text-[8px] uppercase text-neutral-400">Stages</dt><dd className="mt-0.5 text-sm font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">{workflow.stages.length}</dd></div>
          <div><dt className="text-[8px] uppercase text-neutral-400">Reviewers</dt><dd className="mt-0.5 text-sm font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">{workflow.reviewers.length}</dd></div>
          <div><dt className="text-[8px] uppercase text-neutral-400">Events</dt><dd className="mt-0.5 text-sm font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">{workflow.history.length}</dd></div>
        </dl>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} aria-hidden className="text-neutral-500" />
          <h3 className="text-xs font-semibold text-neutral-950 dark:text-neutral-100">Approval guards</h3>
          {validation.checking && <LoaderCircle size={12} className="ml-auto animate-spin text-neutral-400" aria-label="Checking document" />}
        </div>
        <div className="mt-2 divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          <label className="flex cursor-pointer items-start gap-3 bg-white p-3 dark:bg-neutral-950">
            <input type="checkbox" checked={workflow.metadata.complianceGate} disabled={busy} onChange={(event) => onPolicyChange({ complianceGate: event.target.checked })} className="mt-0.5 h-3.5 w-3.5 accent-indigo-600" />
            <span><span className="block text-[10px] font-semibold text-neutral-800 dark:text-neutral-200">Block on critical compliance findings</span><span className="mt-0.5 block text-[9px] leading-4 text-neutral-500">Critical findings must be resolved before approval.</span></span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 bg-white p-3 dark:bg-neutral-950">
            <input type="checkbox" checked={workflow.metadata.requireResolvedSuggestions} disabled={busy} onChange={(event) => onPolicyChange({ requireResolvedSuggestions: event.target.checked })} className="mt-0.5 h-3.5 w-3.5 accent-indigo-600" />
            <span><span className="block text-[10px] font-semibold text-neutral-800 dark:text-neutral-200">Require resolved suggestions</span><span className="mt-0.5 block text-[9px] leading-4 text-neutral-500">Pending tracked changes must be accepted or rejected.</span></span>
          </label>
        </div>
      </div>

      <div aria-live="polite">
        <h3 className="text-[9px] font-semibold uppercase text-neutral-400">Validation</h3>
        {validation.issues.length === 0 ? (
          <p className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-[10px] font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"><CheckCircle2 size={13} aria-hidden />Ready for approval.</p>
        ) : (
          <div className="mt-2 space-y-2">{validation.issues.map((issue) => <article key={issue.id} className={`rounded-lg border p-3 ${issue.severity === 'blocking' ? 'border-red-100 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300' : 'border-amber-100 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300'}`}><div className="flex gap-2"><AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden /><div><h4 className="text-[10px] font-semibold">{issue.title}</h4><p className="mt-0.5 text-[9px] leading-4 opacity-80">{issue.description}</p></div></div></article>)}</div>
        )}
      </div>
    </section>
  )
}
