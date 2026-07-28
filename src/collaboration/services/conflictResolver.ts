import type {
  CollaborationConflict,
  CollaborationOperation,
  CollaborationSharedState,
} from '../types/collaboration'

export interface OperationResolution {
  apply: boolean
  conflict: CollaborationConflict | null
}

export function resolveOperation(
  current: CollaborationOperation | null,
  incoming: CollaborationOperation,
): OperationResolution {
  if (!current) return { apply: true, conflict: null }
  if (current.id === incoming.id) return { apply: false, conflict: null }

  const divergent = incoming.baseRevision < current.revision
  const currentRank = `${String(current.revision).padStart(12, '0')}:${String(current.createdAt).padStart(16, '0')}:${current.clientId}`
  const incomingRank = `${String(incoming.revision).padStart(12, '0')}:${String(incoming.createdAt).padStart(16, '0')}:${incoming.clientId}`
  const apply = incomingRank > currentRank

  return {
    apply,
    conflict: divergent ? {
      id: crypto.randomUUID(),
      message: apply
        ? 'Concurrent edits were reconciled using the latest complete document state.'
        : 'A concurrent document update was safely ignored because a newer state is already active.',
      detectedAt: Date.now(),
      localRevision: current.revision,
      remoteRevision: incoming.revision,
    } : null,
  }
}

export function mergeSharedState(
  current: CollaborationSharedState,
  incoming: CollaborationSharedState,
): CollaborationSharedState {
  const mergeById = <Value extends { id: string; updatedAt: number }>(
    left: Value[],
    right: Value[],
  ) => {
    const merged = new Map(left.map((value) => [value.id, value]))
    for (const value of right) {
      const existing = merged.get(value.id)
      if (!existing || value.updatedAt >= existing.updatedAt) merged.set(value.id, value)
    }
    return [...merged.values()]
  }

  const removedComments = { ...current.removedComments }
  for (const [commentId, removedAt] of Object.entries(incoming.removedComments ?? {})) {
    removedComments[commentId] = Math.max(removedComments[commentId] ?? 0, removedAt)
  }
  const comments = mergeById(current.comments, incoming.comments)
    .filter((comment) => comment.updatedAt > (removedComments[comment.id] ?? 0))

  return {
    comments,
    removedComments,
    trackChanges: mergeById(current.trackChanges, incoming.trackChanges),
    workflow: incoming.updatedAt >= current.updatedAt
      ? incoming.workflow
      : current.workflow,
    updatedAt: Math.max(current.updatedAt, incoming.updatedAt),
    clientId: incoming.updatedAt >= current.updatedAt ? incoming.clientId : current.clientId,
  }
}
