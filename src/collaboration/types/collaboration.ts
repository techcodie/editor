import type { Comment } from '../../review/types/comment'
import type { TrackChange } from '../../review/trackChanges/types/trackChange'
import type { Workflow } from '../../workflow/types/workflow'
import type { EditorDocumentNode } from '../../lib/editor-api'
import type { AwarenessState, CollaborationUser } from './presence'

export type CollaborationConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'

export type CollaborationSyncStatus = 'idle' | 'syncing' | 'synced' | 'conflict'

export interface CollaborationOperation {
  id: string
  clientId: string
  userId: string
  revision: number
  baseRevision: number
  createdAt: number
  snapshot: EditorDocumentNode
}

export interface CollaborationSharedState {
  comments: Comment[]
  removedComments: Record<string, number>
  trackChanges: TrackChange[]
  workflow: Workflow | null
  updatedAt: number
  clientId: string
}

export type CollaborationMessage =
  | { type: 'hello'; roomId: string; awareness: AwarenessState }
  | { type: 'leave'; roomId: string; clientId: string }
  | { type: 'awareness'; roomId: string; awareness: AwarenessState }
  | { type: 'sync-request'; roomId: string; clientId: string }
  | { type: 'operation'; roomId: string; operation: CollaborationOperation }
  | { type: 'shared-state'; roomId: string; state: CollaborationSharedState }

export interface CollaborationTransportHandlers {
  onMessage(message: CollaborationMessage): void
  onStatus(status: CollaborationConnectionStatus): void
  onError(error: unknown): void
}

export interface CollaborationTransport {
  connect(
    roomId: string,
    clientId: string,
    handlers: CollaborationTransportHandlers,
  ): void | Promise<void>
  send(message: CollaborationMessage): void
  disconnect(): void
}

export interface CollaborationConfig {
  roomId: string
  user: CollaborationUser
  transport?: CollaborationTransport
  awarenessThrottleMs?: number
  syncBatchMs?: number
}

export interface ResolvedCollaborationConfig {
  roomId: string
  user: CollaborationUser
  transport?: CollaborationTransport
  awarenessThrottleMs: number
  syncBatchMs: number
}

export interface CollaborationConflict {
  id: string
  message: string
  detectedAt: number
  localRevision: number
  remoteRevision: number
}
