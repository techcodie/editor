import type { EditorApi } from '../../lib/editor-api'
import type { Comment } from '../../review/types/comment'
import type { TrackChange } from '../../review/trackChanges/types/trackChange'
import type { Workflow } from '../../workflow/types/workflow'
import { createThrottledAwarenessPublisher, readAwareness } from './awarenessManager'
import { mergeSharedState } from './conflictResolver'
import { PresenceManager } from './presenceManager'
import { createSyncEngine, type SyncEngine } from './syncEngine'
import { createBroadcastChannelTransport } from './transportAdapter'
import type {
  CollaborationConflict,
  CollaborationConnectionStatus,
  CollaborationMessage,
  CollaborationSharedState,
  CollaborationSyncStatus,
  ResolvedCollaborationConfig,
} from '../types/collaboration'
import type { Collaborator } from '../types/presence'

export interface CollaborationSnapshot {
  collaborators: Collaborator[]
  connectionStatus: CollaborationConnectionStatus
  syncStatus: CollaborationSyncStatus
  conflict: CollaborationConflict | null
  revision: number
  remoteOperationCount: number
}

export interface CollaborationEngineOptions {
  api: EditorApi
  config: ResolvedCollaborationConfig
  initialSharedState: Omit<CollaborationSharedState, 'updatedAt' | 'clientId'>
  onSharedState(state: CollaborationSharedState): void
  onError(error: unknown): void
  onRemoteOperation(): void
}

export interface CollaborationEngine {
  start(): void
  stop(): void
  subscribe(listener: (snapshot: CollaborationSnapshot) => void): () => void
  updateSharedState(state: Omit<CollaborationSharedState, 'updatedAt' | 'clientId'>): void
  dismissConflict(): void
  reconnect(): void
}

const INITIAL_SNAPSHOT: CollaborationSnapshot = {
  collaborators: [],
  connectionStatus: 'disconnected',
  syncStatus: 'idle',
  conflict: null,
  revision: 0,
  remoteOperationCount: 0,
}

export function createCollaborationEngine({
  api,
  config,
  initialSharedState,
  onSharedState,
  onError,
  onRemoteOperation,
}: CollaborationEngineOptions): CollaborationEngine {
  const clientId = crypto.randomUUID()
  const transport = config.transport ?? createBroadcastChannelTransport()
  const presence = new PresenceManager()
  const listeners = new Set<(snapshot: CollaborationSnapshot) => void>()
  let snapshot = { ...INITIAL_SNAPSHOT }
  let started = false
  let typingTimer: number | undefined
  let heartbeatTimer: number | undefined
  let sharedTimer: number | undefined
  let unsubscribeChanges: (() => void) | undefined
  let visibilityListener: (() => void) | undefined
  let typing = false
  let sharedState: CollaborationSharedState = {
    ...initialSharedState,
    updatedAt: 0,
    clientId,
  }
  let sync: SyncEngine

  const emit = (patch: Partial<CollaborationSnapshot> = {}) => {
    snapshot = { ...snapshot, ...patch, collaborators: presence.list() }
    for (const listener of listeners) listener(snapshot)
  }

  const send = (message: CollaborationMessage) => transport.send(message)
  const awareness = (typing = false) => readAwareness(api, config.user, clientId, typing)
  const awarenessPublisher = createThrottledAwarenessPublisher(
    config.awarenessThrottleMs,
    () => send({ type: 'awareness', roomId: config.roomId, awareness: awareness(typing) }),
  )

  sync = createSyncEngine({
    api,
    clientId,
    userId: config.user.id,
    batchMs: config.syncBatchMs,
    publish: (operation) => {
      send({ type: 'operation', roomId: config.roomId, operation })
      emit({ revision: operation.revision, syncStatus: 'synced' })
    },
    onRemoteOperation: () => {
      onRemoteOperation()
      emit({
        revision: sync.revision(),
        remoteOperationCount: snapshot.remoteOperationCount + 1,
        syncStatus: 'synced',
      })
    },
    onConflict: (conflict) => emit({ conflict, syncStatus: 'conflict' }),
    onSyncing: (isSyncing) => emit({ syncStatus: isSyncing ? 'syncing' : 'synced' }),
  })

  const publishSharedState = () => {
    window.clearTimeout(sharedTimer)
    sharedTimer = undefined
    send({ type: 'shared-state', roomId: config.roomId, state: sharedState })
  }

  const handleMessage = (message: CollaborationMessage) => {
    if (message.roomId !== config.roomId) return
    switch (message.type) {
      case 'hello':
        if (message.awareness.clientId === clientId) return
        presence.update(message.awareness)
        send({ type: 'awareness', roomId: config.roomId, awareness: awareness() })
        publishSharedState()
        emit()
        break
      case 'leave':
        presence.remove(message.clientId)
        emit()
        break
      case 'awareness':
        if (message.awareness.clientId === clientId) return
        presence.update(message.awareness)
        emit()
        break
      case 'sync-request':
        if (message.clientId !== clientId) sync.publishCurrent()
        break
      case 'operation':
        sync.receive(message.operation)
        break
      case 'shared-state':
        if (message.state.clientId === clientId) return
        sharedState = mergeSharedState(sharedState, message.state)
        onSharedState(sharedState)
        break
    }
  }

  const connect = () => {
    void transport.connect(config.roomId, clientId, {
      onMessage: handleMessage,
      onStatus: (connectionStatus) => {
        emit({ connectionStatus })
        if (connectionStatus !== 'connected') return
        const current = awareness()
        send({ type: 'hello', roomId: config.roomId, awareness: current })
        send({ type: 'sync-request', roomId: config.roomId, clientId })
        presence.update(current)
        emit({ syncStatus: 'synced' })
      },
      onError: (error) => {
        onError(error)
        emit({ connectionStatus: 'error' })
      },
    })
  }

  return {
    start() {
      if (started) return
      started = true
      unsubscribeChanges = api.subscribeDocumentChanges((change) => {
        if (change.origin === 'local' && change.docChanged) {
          sync.queueLocalChange()
          typing = true
          window.clearTimeout(typingTimer)
          awarenessPublisher.schedule()
          typingTimer = window.setTimeout(() => {
            typing = false
            awarenessPublisher.flush()
          }, 900)
        } else if (change.selectionChanged) {
          awarenessPublisher.schedule()
        }
      })
      visibilityListener = () => awarenessPublisher.flush()
      document.addEventListener('visibilitychange', visibilityListener)
      heartbeatTimer = window.setInterval(() => {
        awarenessPublisher.flush()
        emit()
      }, 15_000)
      connect()
    },
    stop() {
      if (!started) return
      started = false
      unsubscribeChanges?.()
      unsubscribeChanges = undefined
      if (visibilityListener) document.removeEventListener('visibilitychange', visibilityListener)
      visibilityListener = undefined
      send({ type: 'leave', roomId: config.roomId, clientId })
      awarenessPublisher.cancel()
      sync.stop()
      window.clearTimeout(typingTimer)
      window.clearTimeout(sharedTimer)
      window.clearInterval(heartbeatTimer)
      transport.disconnect()
      presence.remove(clientId)
      emit({ connectionStatus: 'disconnected', syncStatus: 'idle' })
    },
    subscribe(listener) {
      listeners.add(listener)
      listener(snapshot)
      return () => listeners.delete(listener)
    },
    updateSharedState(state) {
      const candidate: CollaborationSharedState = {
        ...state,
        updatedAt: Date.now(),
        clientId,
      }
      if (JSON.stringify(state) === JSON.stringify({
        comments: sharedState.comments,
        removedComments: sharedState.removedComments,
        trackChanges: sharedState.trackChanges,
        workflow: sharedState.workflow,
      })) return
      sharedState = candidate
      window.clearTimeout(sharedTimer)
      sharedTimer = window.setTimeout(publishSharedState, config.syncBatchMs)
    },
    dismissConflict() {
      emit({ conflict: null, syncStatus: 'synced' })
    },
    reconnect() {
      transport.disconnect()
      emit({ connectionStatus: 'reconnecting' })
      connect()
    },
  }
}

export type CollaborationEntityState = {
  comments: Comment[]
  removedComments: Record<string, number>
  trackChanges: TrackChange[]
  workflow: Workflow | null
}
