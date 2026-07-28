import { useCallback, useEffect, useRef, useState } from 'react'
import type { EditorApi } from '../../lib/editor-api'
import type { InternalDocumentEditorEvents } from '../../sdk/events'
import {
  createCollaborationEngine,
  type CollaborationEntityState,
  type CollaborationSnapshot,
} from '../services/collaborationEngine'
import type { ResolvedCollaborationConfig } from '../types/collaboration'
import { usePresence } from './usePresence'
import { useSync } from './useSync'

interface UseCollaborationOptions {
  api: EditorApi | null
  config: false | ResolvedCollaborationConfig
  sharedState: CollaborationEntityState
  historyNamespace: string
  events: InternalDocumentEditorEvents
  onSharedState(state: CollaborationEntityState): void
}

const EMPTY_SNAPSHOT: CollaborationSnapshot = {
  collaborators: [],
  connectionStatus: 'disconnected',
  syncStatus: 'idle',
  conflict: null,
  revision: 0,
  remoteOperationCount: 0,
}

export function useCollaboration({
  api,
  config,
  sharedState,
  historyNamespace,
  events,
  onSharedState,
}: UseCollaborationOptions) {
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT)
  const sharedStateRef = useRef(sharedState)
  const onSharedStateRef = useRef(onSharedState)
  const checkpointTimerRef = useRef<number | undefined>(undefined)
  const engineRef = useRef<ReturnType<typeof createCollaborationEngine> | null>(null)
  sharedStateRef.current = sharedState
  onSharedStateRef.current = onSharedState

  useEffect(() => {
    if (!api || !config) {
      setSnapshot(EMPTY_SNAPSHOT)
      return
    }
    const engine = createCollaborationEngine({
      api,
      config,
      initialSharedState: sharedStateRef.current,
      onSharedState: (state) => onSharedStateRef.current({
        comments: state.comments,
        removedComments: state.removedComments,
        trackChanges: state.trackChanges,
        workflow: state.workflow,
      }),
      onError: (cause) => events.emit('error', {
        scope: 'collaboration',
        message: 'The collaboration connection encountered an error.',
        cause,
      }),
      onRemoteOperation: () => {
        window.clearTimeout(checkpointTimerRef.current)
        checkpointTimerRef.current = window.setTimeout(() => {
          void import('../services/collaborationCheckpoint')
            .then(({ saveCollaborationCheckpoint }) => (
              saveCollaborationCheckpoint(api, historyNamespace, config.user)
            ))
            .catch((cause) => events.emit('error', {
              scope: 'collaboration',
              message: 'The collaborative history checkpoint could not be saved.',
              cause,
            }))
        }, 4_000)
      },
    })
    engineRef.current = engine
    const unsubscribe = engine.subscribe((next) => {
      setSnapshot(next)
      events.emit('collaborationStatus', {
        roomId: config.roomId,
        connectionStatus: next.connectionStatus,
        syncStatus: next.syncStatus,
      })
      events.emit('collaboratorsChange', { collaborators: next.collaborators })
    })
    engine.start()
    return () => {
      window.clearTimeout(checkpointTimerRef.current)
      unsubscribe()
      engine.stop()
      engineRef.current = null
    }
  }, [api, config, events, historyNamespace])

  useEffect(() => {
    engineRef.current?.updateSharedState(sharedState)
  }, [sharedState])

  const presence = usePresence(snapshot)
  const sync = useSync(snapshot)
  const dismissConflict = useCallback(() => engineRef.current?.dismissConflict(), [])
  const reconnect = useCallback(() => engineRef.current?.reconnect(), [])

  return { ...presence, ...sync, dismissConflict, reconnect }
}
