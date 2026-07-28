import { useMemo } from 'react'
import type { CollaborationSnapshot } from '../services/collaborationEngine'

export function usePresence(snapshot: CollaborationSnapshot) {
  return useMemo(() => ({
    collaborators: snapshot.collaborators,
    onlineCollaborators: snapshot.collaborators.filter(
      (collaborator) => collaborator.status !== 'offline',
    ),
    activeEditor: snapshot.collaborators.find((collaborator) => collaborator.typing) ?? null,
  }), [snapshot.collaborators])
}
