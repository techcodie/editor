import type { WorkflowStatus } from './workflow'

export type ReviewerStatus = 'pending' | 'approved' | 'rejected' | 'changes-requested'

export interface ApprovalReviewer {
  id: string
  name: string
  status: ReviewerStatus
  notes: string
  assignedAt: number
  respondedAt?: number
}

export type ApprovalDecision = 'approve' | 'reject' | 'request-changes' | 'skip-stage'

export type WorkflowAction =
  | 'created'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'changes-requested'
  | 'stage-skipped'
  | 'note-added'
  | 'reviewer-assigned'
  | 'reviewer-reassigned'
  | 'reviewer-removed'
  | 'archived'
  | 'restored'

export interface WorkflowHistoryEntry {
  id: string
  action: WorkflowAction
  actorId: string
  actorName: string
  timestamp: number
  previousStatus: WorkflowStatus
  nextStatus: WorkflowStatus
  stageId?: string
  stageName?: string
  reason: string
  notes: string
  linkedCommentIds: string[]
  snapshotVersionId?: string
}

export interface ApprovalRequest {
  decision: ApprovalDecision
  actorId: string
  actorName: string
  reason: string
  notes: string
  linkedCommentIds: string[]
  snapshotVersionId?: string
}
