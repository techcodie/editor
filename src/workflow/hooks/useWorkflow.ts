import { useCallback, useEffect, useMemo, useState } from 'react'
import type { EditorApi } from '../../lib/editor-api'
import type { CommentAuthor } from '../../review/types/comment'
import type { ContractAnalysis } from '../../contract/types/contract'
import {
  addWorkflowNote,
  applyApprovalDecision,
  archiveWorkflow,
  assignReviewer,
  reassignReviewer,
  removeReviewer,
  restoreWorkflow,
  submitWorkflow,
  updateReviewerNotes,
} from '../services/approvalManager'
import { createWorkflowSnapshot } from '../services/workflowHistory'
import {
  addStage,
  createWorkflow,
  removeStage,
  renameWorkflow,
  setWorkflowPolicy,
  updateStage,
} from '../services/workflowEngine'
import {
  clearWorkflow,
  loadWorkflow,
  saveWorkflow,
  WORKFLOW_STORAGE_EVENT,
} from '../services/workflowSerializer'
import { inspectWorkflowDocument, validateWorkflow } from '../services/workflowValidator'
import type { ApprovalDecision, ApprovalRequest } from '../types/approval'
import type { Workflow, WorkflowStage, WorkflowValidation } from '../types/workflow'
import type { IdentityAuditInput } from '../../identity/types/identity'

interface UseWorkflowOptions {
  active: boolean
  api: EditorApi | null
  namespace: string
  author: CommentAuthor
  unresolvedSuggestions: number
  onChange?: (workflow: Workflow | null) => void
  contractAnalysis?: ContractAnalysis | null
  onAudit?: (input: IdentityAuditInput) => void
}

const EMPTY_VALIDATION: WorkflowValidation = {
  valid: true,
  checking: false,
  criticalFindings: 0,
  unresolvedSuggestions: 0,
  contractRiskScore: 0,
  contractHighRisks: 0,
  issues: [],
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'The workflow action could not be completed.'
}

export function useWorkflow({ active, api, namespace, author, unresolvedSuggestions, onChange, contractAnalysis, onAudit }: UseWorkflowOptions) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validation, setValidation] = useState<WorkflowValidation>(EMPTY_VALIDATION)

  useEffect(() => {
    let mounted = true
    const reload = () => {
      void loadWorkflow(namespace).then((stored) => {
        if (!mounted) return
        setWorkflow(stored)
        setLoaded(true)
        onChange?.(stored)
      })
    }
    reload()
    window.addEventListener(WORKFLOW_STORAGE_EVENT, reload)
    return () => { mounted = false; window.removeEventListener(WORKFLOW_STORAGE_EVENT, reload) }
  }, [namespace, onChange])

  useEffect(() => {
    if (!active || !workflow) {
      setValidation((current) => validateWorkflow(workflow, unresolvedSuggestions, current.criticalFindings, false, contractAnalysis?.overallRiskScore ?? 0, contractAnalysis?.risks.filter((risk) => ['high', 'critical'].includes(risk.level)).length ?? 0))
      return
    }
    let cancelled = false
    let timeout: number | undefined
    const inspect = () => {
      const contractHighRisks = contractAnalysis?.risks.filter((risk) => ['high', 'critical'].includes(risk.level)).length ?? 0
      setValidation((current) => validateWorkflow(workflow, unresolvedSuggestions, current.criticalFindings, true, contractAnalysis?.overallRiskScore ?? 0, contractHighRisks))
      void inspectWorkflowDocument(api).then((criticalFindings) => {
        if (!cancelled) setValidation(validateWorkflow(workflow, unresolvedSuggestions, criticalFindings, false, contractAnalysis?.overallRiskScore ?? 0, contractHighRisks))
      }).catch(() => {
        if (!cancelled) setValidation(validateWorkflow(workflow, unresolvedSuggestions, 0, false, contractAnalysis?.overallRiskScore ?? 0, contractHighRisks))
      })
    }
    inspect()
    const unsubscribe = api?.subscribe(() => {
      window.clearTimeout(timeout)
      timeout = window.setTimeout(inspect, 900)
    })
    return () => { cancelled = true; window.clearTimeout(timeout); unsubscribe?.() }
  }, [active, api, contractAnalysis, unresolvedSuggestions, workflow])

  const persist = useCallback(async (next: Workflow | null) => {
    await saveWorkflow(namespace, next)
    setWorkflow(next)
    onChange?.(next)
  }, [namespace, onChange])

  const mutate = useCallback(async (operation: (current: Workflow) => Workflow) => {
    if (!workflow || saving) return false
    setSaving(true)
    setError(null)
    try {
      await persist(operation(workflow))
      return true
    } catch (reason) {
      setError(errorMessage(reason))
      return false
    } finally { setSaving(false) }
  }, [persist, saving, workflow])

  const create = useCallback(async (name: string) => {
    if (saving) return false
    setSaving(true)
    setError(null)
    try {
      await persist(createWorkflow(name, author))
      return true
    } catch (reason) {
      setError(errorMessage(reason))
      return false
    } finally { setSaving(false) }
  }, [author, persist, saving])

  const submit = useCallback(async (notes = '') => {
    const workflowBlock = validation.issues.find((issue) => issue.source === 'workflow' && issue.severity === 'blocking')
    if (workflowBlock) { setError(workflowBlock.description); return false }
    return mutate((current) => submitWorkflow(current, author, notes))
  }, [author, mutate, validation.issues])

  const decide = useCallback(async (
    decision: ApprovalDecision,
    request: Omit<ApprovalRequest, 'decision' | 'snapshotVersionId'>,
  ) => {
    if (!workflow || !api || saving) return false
    if (decision === 'approve' && !validation.valid) {
      setError(validation.issues.find((issue) => issue.severity === 'blocking')?.description ?? 'Resolve workflow blockers before approval.')
      onAudit?.({
        category: 'workflow',
        action: `workflow.${decision}`,
        outcome: 'failure',
        resourceId: workflow.id,
        details: { reason: 'validation-blocked' },
      })
      return false
    }
    setSaving(true)
    setError(null)
    try {
      const snapshotVersionId = await createWorkflowSnapshot(
        api,
        namespace,
        author,
        workflow,
        decision.replace('-', ' '),
      )
      const next = applyApprovalDecision(workflow, { ...request, decision, snapshotVersionId })
      await persist(next)
      onAudit?.({
        category: 'workflow',
        action: `workflow.${decision}`,
        outcome: 'success',
        resourceId: workflow.id,
        details: { actorId: request.actorId },
      })
      return true
    } catch (reason) {
      setError(errorMessage(reason))
      onAudit?.({
        category: 'workflow',
        action: `workflow.${decision}`,
        outcome: 'failure',
        resourceId: workflow.id,
      })
      return false
    } finally { setSaving(false) }
  }, [api, author, namespace, onAudit, persist, saving, validation.issues, validation.valid, workflow])

  const currentStage = workflow?.stages[workflow.currentStage] ?? null
  const stageReviewers = useMemo(() => {
    const assigned = new Set(currentStage?.reviewerIds ?? [])
    return workflow?.reviewers.filter((reviewer) => assigned.has(reviewer.id)) ?? []
  }, [currentStage?.reviewerIds, workflow?.reviewers])

  return {
    workflow,
    currentStage,
    stageReviewers,
    loaded,
    saving,
    error,
    validation,
    clearError: () => setError(null),
    create,
    rename: (name: string) => mutate((current) => renameWorkflow(current, name)),
    addStage: () => mutate(addStage),
    updateStage: (stageId: string, patch: Partial<Pick<WorkflowStage, 'name' | 'description' | 'dueDate'>>) => mutate((current) => updateStage(current, stageId, patch)),
    removeStage: (stageId: string) => mutate((current) => removeStage(current, stageId)),
    setPolicy: (patch: Partial<Workflow['metadata']>) => mutate((current) => setWorkflowPolicy(current, patch)),
    assignReviewer: (stageId: string, name: string) => mutate((current) => assignReviewer(current, stageId, name, author)),
    removeReviewer: (reviewerId: string) => mutate((current) => removeReviewer(current, reviewerId, author)),
    reassignReviewer: (reviewerId: string, stageId: string) => mutate((current) => reassignReviewer(current, reviewerId, stageId, author)),
    updateReviewerNotes: (reviewerId: string, notes: string) => mutate((current) => updateReviewerNotes(current, reviewerId, notes)),
    submit,
    decide,
    addNote: (notes: string, linkedCommentIds?: string[]) => mutate((current) => addWorkflowNote(current, author, notes, linkedCommentIds)),
    archive: () => mutate((current) => archiveWorkflow(current, author)),
    restore: () => mutate((current) => restoreWorkflow(current, author)),
    remove: async () => { await clearWorkflow(namespace); setWorkflow(null); onChange?.(null) },
  }
}
