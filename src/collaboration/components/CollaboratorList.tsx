import { PenLine, Users } from 'lucide-react'
import type {
  CollaborationConnectionStatus,
  CollaborationSyncStatus,
} from '../types/collaboration'
import type { Collaborator } from '../types/presence'
import type { Workflow } from '../../workflow/types/workflow'
import { ConnectionIndicator } from './ConnectionIndicator'
import { SyncStatus } from './SyncStatus'
import { UserBadge } from './UserBadge'

interface CollaboratorListProps {
  collaborators: Collaborator[]
  currentUserId: string
  connectionStatus: CollaborationConnectionStatus
  syncStatus: CollaborationSyncStatus
  onReconnect(): void
  workflow?: Workflow | null
}

export function CollaboratorList({
  collaborators,
  currentUserId,
  connectionStatus,
  syncStatus,
  onReconnect,
  workflow,
}: CollaboratorListProps) {
  return (
    <div className="absolute right-0 top-11 z-50 w-72 rounded-lg border border-neutral-200 bg-white p-2 shadow-[var(--document-editor-shadow-overlay)]" role="dialog" aria-label="Document collaborators">
      <div className="flex items-center justify-between border-b border-neutral-100 px-2 py-2">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-900"><Users size={14} aria-hidden />Collaborators</span>
        <ConnectionIndicator status={connectionStatus} />
      </div>
      <div className="max-h-64 overflow-y-auto py-1" role="list">
        {collaborators.map((collaborator) => (
          <div key={collaborator.clientId} className="flex min-h-12 items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-neutral-50" role="listitem">
            <UserBadge user={collaborator} showStatus />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-medium text-neutral-900">{collaborator.name}</span>
                {collaborator.id === currentUserId && <span className="text-[10px] text-neutral-400">You</span>}
              </div>
              <span className="flex items-center gap-1 text-[10px] text-neutral-500">
                {collaborator.typing && <PenLine size={10} aria-hidden />}
                {collaborator.typing ? 'Editing now' : collaborator.status === 'away' ? 'Away' : 'Viewing'}
              </span>
            </div>
          </div>
        ))}
      </div>
      {workflow && (
        <div className="border-t border-neutral-100 px-2 py-2">
          <p className="text-[10px] font-semibold uppercase text-neutral-400">Active review</p>
          <p className="mt-1 truncate text-xs font-medium text-neutral-800">{workflow.stages[workflow.currentStage]?.name ?? workflow.name}</p>
          <p className="mt-0.5 text-[10px] text-neutral-500">{workflow.stages[workflow.currentStage]?.reviewerIds.length ?? 0} active reviewers · {workflow.status.replace('-', ' ')}</p>
        </div>
      )}
      <div className="flex items-center justify-between border-t border-neutral-100 px-2 pt-2">
        <SyncStatus status={syncStatus} />
        {(connectionStatus === 'error' || connectionStatus === 'disconnected') && (
          <button type="button" onClick={onReconnect} className="rounded px-2 py-1 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35">Reconnect</button>
        )}
      </div>
    </div>
  )
}
