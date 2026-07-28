import type { ApprovalReviewer, WorkflowHistoryEntry } from './approval'

export type WorkflowStatus =
  | 'draft'
  | 'in-review'
  | 'changes-requested'
  | 'approved'
  | 'rejected'
  | 'archived'

export type WorkflowStageStatus = 'pending' | 'active' | 'approved' | 'rejected' | 'skipped'

export interface WorkflowStage {
  id: string
  name: string
  description: string
  reviewerIds: string[]
  status: WorkflowStageStatus
  dueDate?: string
  completedAt?: number
}

export interface WorkflowMetadata {
  complianceGate: boolean
  requireResolvedSuggestions: boolean
  archivedFrom?: Exclude<WorkflowStatus, 'archived'>
}

export interface Workflow {
  id: string
  name: string
  status: WorkflowStatus
  createdAt: number
  updatedAt: number
  currentStage: number
  stages: WorkflowStage[]
  reviewers: ApprovalReviewer[]
  history: WorkflowHistoryEntry[]
  metadata: WorkflowMetadata
}

export type WorkflowValidationSeverity = 'blocking' | 'warning'

export interface WorkflowValidationIssue {
  id: string
  title: string
  description: string
  severity: WorkflowValidationSeverity
  source: 'workflow' | 'compliance' | 'track-changes'
}

export interface WorkflowValidation {
  valid: boolean
  checking: boolean
  criticalFindings: number
  unresolvedSuggestions: number
  issues: WorkflowValidationIssue[]
  checkedAt?: number
}

export interface WorkflowStoragePayload {
  formatVersion: 1
  updatedAt: number
  workflow: Workflow | null
}
