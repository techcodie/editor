import type { ApprovalRequest, ApprovalReviewer, WorkflowAction, WorkflowHistoryEntry } from '../types/approval'
import type { Workflow, WorkflowStage } from '../types/workflow'

interface WorkflowActor { id: string; name: string }

function entry(
  workflow: Workflow,
  action: WorkflowAction,
  actor: WorkflowActor,
  nextStatus: Workflow['status'],
  options: {
    stage?: WorkflowStage
    reason?: string
    notes?: string
    linkedCommentIds?: string[]
    snapshotVersionId?: string
  } = {},
): WorkflowHistoryEntry {
  return {
    id: crypto.randomUUID(),
    action,
    actorId: actor.id,
    actorName: actor.name,
    timestamp: Date.now(),
    previousStatus: workflow.status,
    nextStatus,
    stageId: options.stage?.id,
    stageName: options.stage?.name,
    reason: options.reason?.trim().slice(0, 500) ?? '',
    notes: options.notes?.trim().slice(0, 2_000) ?? '',
    linkedCommentIds: options.linkedCommentIds ?? [],
    snapshotVersionId: options.snapshotVersionId,
  }
}

function resetReviewers(reviewers: ApprovalReviewer[], stage: WorkflowStage): ApprovalReviewer[] {
  const assigned = new Set(stage.reviewerIds)
  return reviewers.map((reviewer) => assigned.has(reviewer.id)
    ? { ...reviewer, status: 'pending', respondedAt: undefined }
    : reviewer)
}

export function submitWorkflow(workflow: Workflow, actor: WorkflowActor, notes = ''): Workflow {
  if (!['draft', 'changes-requested'].includes(workflow.status)) {
    throw new Error('This workflow cannot be submitted from its current state.')
  }
  const currentStage = workflow.stages[workflow.currentStage]
  if (!currentStage) throw new Error('Add at least one review stage before submitting.')
  const now = Date.now()
  const stages = workflow.stages.map((stage, index) => ({
    ...stage,
    status: index === workflow.currentStage ? 'active' as const : stage.status,
  }))
  const next: Workflow = {
    ...workflow,
    status: 'in-review',
    updatedAt: now,
    stages,
    reviewers: resetReviewers(workflow.reviewers, currentStage),
  }
  return {
    ...next,
    history: [entry(workflow, 'submitted', actor, 'in-review', { stage: currentStage, reason: 'Submitted for review', notes }), ...workflow.history],
  }
}

function advanceStage(workflow: Workflow, stage: WorkflowStage, stageStatus: WorkflowStage['status']) {
  const completedAt = Date.now()
  const nextIndex = workflow.currentStage + 1
  const hasNext = nextIndex < workflow.stages.length
  const stages = workflow.stages.map((item, index) => {
    if (item.id === stage.id) return { ...item, status: stageStatus, completedAt }
    if (hasNext && index === nextIndex) return { ...item, status: 'active' as const }
    return item
  })
  return { stages, currentStage: hasNext ? nextIndex : workflow.currentStage, status: hasNext ? 'in-review' as const : 'approved' as const }
}

export function applyApprovalDecision(workflow: Workflow, request: ApprovalRequest): Workflow {
  if (workflow.status !== 'in-review') throw new Error('A decision requires an active review.')
  const stage = workflow.stages[workflow.currentStage]
  if (!stage) throw new Error('The active review stage is unavailable.')
  if (!stage.reviewerIds.includes(request.actorId) && request.decision !== 'skip-stage') {
    throw new Error('Select a reviewer assigned to this stage.')
  }
  const now = Date.now()
  let reviewers = workflow.reviewers
  let stages = workflow.stages
  let status: Workflow['status'] = workflow.status
  let currentStage = workflow.currentStage
  let action: WorkflowAction

  if (request.decision === 'approve') {
    reviewers = reviewers.map((reviewer) => reviewer.id === request.actorId
      ? { ...reviewer, status: 'approved', notes: request.notes.trim().slice(0, 2_000), respondedAt: now }
      : reviewer)
    const allApproved = stage.reviewerIds.every((id) => reviewers.find((reviewer) => reviewer.id === id)?.status === 'approved')
    if (allApproved) ({ stages, status, currentStage } = advanceStage({ ...workflow, reviewers }, stage, 'approved'))
    action = 'approved'
  } else if (request.decision === 'reject') {
    reviewers = reviewers.map((reviewer) => reviewer.id === request.actorId
      ? { ...reviewer, status: 'rejected', notes: request.notes.trim().slice(0, 2_000), respondedAt: now }
      : reviewer)
    stages = stages.map((item) => item.id === stage.id ? { ...item, status: 'rejected', completedAt: now } : item)
    status = 'rejected'
    action = 'rejected'
  } else if (request.decision === 'request-changes') {
    reviewers = reviewers.map((reviewer) => reviewer.id === request.actorId
      ? { ...reviewer, status: 'changes-requested', notes: request.notes.trim().slice(0, 2_000), respondedAt: now }
      : reviewer)
    status = 'changes-requested'
    action = 'changes-requested'
  } else {
    ({ stages, status, currentStage } = advanceStage(workflow, stage, 'skipped'))
    action = 'stage-skipped'
  }

  return {
    ...workflow,
    status,
    currentStage,
    updatedAt: now,
    stages,
    reviewers,
    history: [entry(workflow, action, { id: request.actorId, name: request.actorName }, status, {
      stage,
      reason: request.reason,
      notes: request.notes,
      linkedCommentIds: request.linkedCommentIds,
      snapshotVersionId: request.snapshotVersionId,
    }), ...workflow.history],
  }
}

export function addWorkflowNote(
  workflow: Workflow,
  actor: WorkflowActor,
  notes: string,
  linkedCommentIds: string[] = [],
): Workflow {
  if (!notes.trim()) return workflow
  const stage = workflow.stages[workflow.currentStage]
  return { ...workflow, updatedAt: Date.now(), history: [entry(workflow, 'note-added', actor, workflow.status, { stage, reason: 'Review note', notes, linkedCommentIds }), ...workflow.history] }
}

export function archiveWorkflow(workflow: Workflow, actor: WorkflowActor): Workflow {
  if (workflow.status === 'archived') return workflow
  const previous = workflow.status
  return {
    ...workflow,
    status: 'archived',
    updatedAt: Date.now(),
    metadata: { ...workflow.metadata, archivedFrom: previous },
    history: [entry(workflow, 'archived', actor, 'archived', { reason: 'Workflow archived' }), ...workflow.history],
  }
}

export function restoreWorkflow(workflow: Workflow, actor: WorkflowActor): Workflow {
  if (workflow.status !== 'archived') return workflow
  const status = workflow.metadata.archivedFrom ?? 'draft'
  return {
    ...workflow,
    status,
    updatedAt: Date.now(),
    metadata: { ...workflow.metadata, archivedFrom: undefined },
    history: [entry(workflow, 'restored', actor, status, { reason: 'Workflow restored' }), ...workflow.history],
  }
}

export function assignReviewer(workflow: Workflow, stageId: string, name: string, actor: WorkflowActor): Workflow {
  if (workflow.status !== 'draft' || !name.trim()) return workflow
  const reviewer: ApprovalReviewer = { id: crypto.randomUUID(), name: name.trim().slice(0, 100), status: 'pending', notes: '', assignedAt: Date.now() }
  const stage = workflow.stages.find((item) => item.id === stageId)
  if (!stage) return workflow
  return {
    ...workflow,
    updatedAt: Date.now(),
    reviewers: [...workflow.reviewers, reviewer],
    stages: workflow.stages.map((item) => item.id === stageId ? { ...item, reviewerIds: [...item.reviewerIds, reviewer.id] } : item),
    history: [entry(workflow, 'reviewer-assigned', actor, workflow.status, { stage, reason: `${reviewer.name} assigned` }), ...workflow.history],
  }
}

export function removeReviewer(workflow: Workflow, reviewerId: string, actor: WorkflowActor): Workflow {
  if (workflow.status !== 'draft') return workflow
  const reviewer = workflow.reviewers.find((item) => item.id === reviewerId)
  if (!reviewer) return workflow
  return {
    ...workflow,
    updatedAt: Date.now(),
    reviewers: workflow.reviewers.filter((item) => item.id !== reviewerId),
    stages: workflow.stages.map((stage) => ({ ...stage, reviewerIds: stage.reviewerIds.filter((id) => id !== reviewerId) })),
    history: [entry(workflow, 'reviewer-removed', actor, workflow.status, { reason: `${reviewer.name} removed` }), ...workflow.history],
  }
}

export function reassignReviewer(workflow: Workflow, reviewerId: string, stageId: string, actor: WorkflowActor): Workflow {
  if (workflow.status !== 'draft') return workflow
  const reviewer = workflow.reviewers.find((item) => item.id === reviewerId)
  const stage = workflow.stages.find((item) => item.id === stageId)
  if (!reviewer || !stage) return workflow
  return {
    ...workflow,
    updatedAt: Date.now(),
    stages: workflow.stages.map((item) => ({
      ...item,
      reviewerIds: item.id === stageId
        ? [...new Set([...item.reviewerIds, reviewerId])]
        : item.reviewerIds.filter((id) => id !== reviewerId),
    })),
    history: [entry(workflow, 'reviewer-reassigned', actor, workflow.status, { stage, reason: `${reviewer.name} reassigned` }), ...workflow.history],
  }
}

export function updateReviewerNotes(workflow: Workflow, reviewerId: string, notes: string): Workflow {
  return { ...workflow, updatedAt: Date.now(), reviewers: workflow.reviewers.map((reviewer) => reviewer.id === reviewerId ? { ...reviewer, notes: notes.trim().slice(0, 2_000) } : reviewer) }
}
