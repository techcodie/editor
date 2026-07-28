import type { ApprovalReviewer, WorkflowHistoryEntry } from '../types/approval'
import type { Workflow, WorkflowStage } from '../types/workflow'

interface WorkflowActor { id: string; name: string }

function historyEntry(
  action: WorkflowHistoryEntry['action'],
  actor: WorkflowActor,
  status: Workflow['status'],
  reason: string,
  stage?: WorkflowStage,
): WorkflowHistoryEntry {
  return {
    id: crypto.randomUUID(),
    action,
    actorId: actor.id,
    actorName: actor.name,
    timestamp: Date.now(),
    previousStatus: status,
    nextStatus: status,
    stageId: stage?.id,
    stageName: stage?.name,
    reason,
    notes: '',
    linkedCommentIds: [],
  }
}

export function createWorkflow(name: string, actor: WorkflowActor): Workflow {
  const now = Date.now()
  const reviewer: ApprovalReviewer = {
    id: actor.id,
    name: actor.name,
    status: 'pending',
    notes: '',
    assignedAt: now,
  }
  const stage: WorkflowStage = {
    id: crypto.randomUUID(),
    name: 'Primary review',
    description: 'Review the document and record a decision.',
    reviewerIds: [reviewer.id],
    status: 'pending',
  }
  return {
    id: crypto.randomUUID(),
    name: name.trim().slice(0, 120) || 'Document approval',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    currentStage: 0,
    stages: [stage],
    reviewers: [reviewer],
    history: [historyEntry('created', actor, 'draft', 'Workflow created', stage)],
    metadata: {
      complianceGate: false,
      requireResolvedSuggestions: true,
      contractRiskGate: false,
    },
  }
}

export function addStage(workflow: Workflow): Workflow {
  if (workflow.status !== 'draft') return workflow
  const stageNumber = workflow.stages.length + 1
  return {
    ...workflow,
    updatedAt: Date.now(),
    stages: [...workflow.stages, {
      id: crypto.randomUUID(),
      name: `Review stage ${stageNumber}`,
      description: '',
      reviewerIds: [],
      status: 'pending',
    }],
  }
}

export function updateStage(
  workflow: Workflow,
  stageId: string,
  patch: Partial<Pick<WorkflowStage, 'name' | 'description' | 'dueDate'>>,
): Workflow {
  if (workflow.status !== 'draft') return workflow
  return {
    ...workflow,
    updatedAt: Date.now(),
    stages: workflow.stages.map((stage) => stage.id === stageId ? {
      ...stage,
      name: patch.name === undefined ? stage.name : patch.name.trim().slice(0, 100) || stage.name,
      description: patch.description === undefined ? stage.description : patch.description.trim().slice(0, 400),
      dueDate: patch.dueDate === undefined ? stage.dueDate : patch.dueDate || undefined,
    } : stage),
  }
}

export function removeStage(workflow: Workflow, stageId: string): Workflow {
  if (workflow.status !== 'draft' || workflow.stages.length <= 1) return workflow
  return { ...workflow, updatedAt: Date.now(), stages: workflow.stages.filter((stage) => stage.id !== stageId) }
}

export function setWorkflowPolicy(
  workflow: Workflow,
  patch: Partial<Workflow['metadata']>,
): Workflow {
  return { ...workflow, updatedAt: Date.now(), metadata: { ...workflow.metadata, ...patch } }
}

export function renameWorkflow(workflow: Workflow, name: string): Workflow {
  const normalized = name.trim().slice(0, 120)
  return normalized ? { ...workflow, name: normalized, updatedAt: Date.now() } : workflow
}
