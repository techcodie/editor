import type { CollaborationSnapshot } from '../services/collaborationEngine'

export function useSync(snapshot: CollaborationSnapshot) {
  return {
    connectionStatus: snapshot.connectionStatus,
    syncStatus: snapshot.syncStatus,
    revision: snapshot.revision,
    conflict: snapshot.conflict,
  }
}
