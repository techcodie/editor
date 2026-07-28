import type { EditorApi, EditorDocumentNode } from '../../lib/editor-api'
import { resolveOperation } from './conflictResolver'
import type {
  CollaborationConflict,
  CollaborationOperation,
} from '../types/collaboration'

export interface SyncEngineOptions {
  api: EditorApi
  clientId: string
  userId: string
  batchMs: number
  publish(operation: CollaborationOperation): void
  onRemoteOperation(): void
  onConflict(conflict: CollaborationConflict): void
  onSyncing(syncing: boolean): void
}

export interface SyncEngine {
  queueLocalChange(): void
  publishCurrent(): void
  receive(operation: CollaborationOperation): void
  stop(): void
  revision(): number
}

export function createSyncEngine({
  api,
  clientId,
  userId,
  batchMs,
  publish,
  onRemoteOperation,
  onConflict,
  onSyncing,
}: SyncEngineOptions): SyncEngine {
  let clock = 0
  let timer: number | undefined
  let currentOperation: CollaborationOperation | null = null
  const seen = new Set<string>()

  const createOperation = (snapshot: EditorDocumentNode): CollaborationOperation => {
    const baseRevision = currentOperation?.revision ?? clock
    clock = Math.max(clock, baseRevision) + 1
    return {
      id: crypto.randomUUID(),
      clientId,
      userId,
      revision: clock,
      baseRevision,
      createdAt: Date.now(),
      snapshot,
    }
  }

  const publishCurrent = () => {
    window.clearTimeout(timer)
    timer = undefined
    const operation = createOperation(api.getDocumentSnapshot())
    currentOperation = operation
    seen.add(operation.id)
    publish(operation)
    onSyncing(false)
  }

  return {
    queueLocalChange() {
      onSyncing(true)
      window.clearTimeout(timer)
      timer = window.setTimeout(publishCurrent, batchMs)
    },
    publishCurrent,
    receive(operation) {
      if (operation.clientId === clientId || seen.has(operation.id)) return
      seen.add(operation.id)
      if (seen.size > 1_000) seen.delete(seen.values().next().value as string)
      clock = Math.max(clock, operation.revision)
      const resolution = resolveOperation(currentOperation, operation)
      if (resolution.conflict) onConflict(resolution.conflict)
      if (!resolution.apply) return
      let applied = false
      try {
        applied = api.replaceDocumentSnapshot(operation.snapshot, { origin: 'remote' })
      } catch {
        applied = false
      }
      if (!applied) {
        onConflict({
          id: crypto.randomUUID(),
          message: 'A remote update contained unsupported document structure and was not applied.',
          detectedAt: Date.now(),
          localRevision: currentOperation?.revision ?? clock,
          remoteRevision: operation.revision,
        })
        return
      }
      currentOperation = operation
      onRemoteOperation()
      onSyncing(false)
    },
    stop() {
      window.clearTimeout(timer)
      timer = undefined
    },
    revision: () => currentOperation?.revision ?? clock,
  }
}
