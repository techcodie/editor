import type {
  CollaborationMessage,
  CollaborationTransport,
  CollaborationTransportHandlers,
} from '../types/collaboration'

function isMessage(value: unknown): value is CollaborationMessage {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  if (typeof candidate.roomId !== 'string' || typeof candidate.type !== 'string') return false
  if (candidate.type === 'leave' || candidate.type === 'sync-request') {
    return typeof candidate.clientId === 'string'
  }
  if (candidate.type === 'hello' || candidate.type === 'awareness') {
    const awareness = candidate.awareness as Record<string, unknown> | undefined
    const user = awareness?.user as Record<string, unknown> | undefined
    return Boolean(
      awareness && user &&
      typeof awareness.clientId === 'string' &&
      typeof user.id === 'string' &&
      typeof user.name === 'string' &&
      typeof user.color === 'string',
    )
  }
  if (candidate.type === 'operation') {
    const operation = candidate.operation as Record<string, unknown> | undefined
    return Boolean(
      operation &&
      typeof operation.id === 'string' &&
      typeof operation.clientId === 'string' &&
      typeof operation.revision === 'number' &&
      operation.snapshot && typeof operation.snapshot === 'object',
    )
  }
  if (candidate.type === 'shared-state') {
    const state = candidate.state as Record<string, unknown> | undefined
    return Boolean(
      state &&
      typeof state.clientId === 'string' &&
      Array.isArray(state.comments) &&
      state.removedComments && typeof state.removedComments === 'object' &&
      Array.isArray(state.trackChanges),
    )
  }
  return false
}

export function createBroadcastChannelTransport(
  channelPrefix = 'techcodie-editor-collaboration',
): CollaborationTransport {
  let channel: BroadcastChannel | null = null
  let handlers: CollaborationTransportHandlers | null = null

  return {
    connect(roomId, _clientId, nextHandlers) {
      handlers = nextHandlers
      nextHandlers.onStatus('connecting')
      if (typeof BroadcastChannel === 'undefined') {
        nextHandlers.onError(new Error('BroadcastChannel is not available in this browser.'))
        nextHandlers.onStatus('error')
        return
      }
      channel = new BroadcastChannel(`${channelPrefix}:${roomId}`)
      channel.addEventListener('message', (event: MessageEvent<unknown>) => {
        if (isMessage(event.data) && event.data.roomId === roomId) {
          handlers?.onMessage(event.data)
        }
      })
      nextHandlers.onStatus('connected')
    },
    send(message) {
      channel?.postMessage(message)
    },
    disconnect() {
      channel?.close()
      channel = null
      handlers?.onStatus('disconnected')
      handlers = null
    },
  }
}

export interface WebSocketTransportOptions {
  url: string | ((roomId: string, clientId: string) => string)
  protocols?: string | string[]
  reconnectDelayMs?: number
}

export function createWebSocketTransport({
  url,
  protocols,
  reconnectDelayMs = 1_500,
}: WebSocketTransportOptions): CollaborationTransport {
  let socket: WebSocket | null = null
  let handlers: CollaborationTransportHandlers | null = null
  let roomId = ''
  let clientId = ''
  let reconnectTimer: number | undefined
  let manuallyClosed = false
  let generation = 0
  const pending: string[] = []

  const connectSocket = () => {
    if (!handlers || manuallyClosed) return
    const endpoint = typeof url === 'function' ? url(roomId, clientId) : url
    handlers.onStatus(socket ? 'reconnecting' : 'connecting')
    const socketGeneration = ++generation
    socket = new WebSocket(endpoint, protocols)
    const activeSocket = socket
    activeSocket.addEventListener('open', () => {
      if (socketGeneration !== generation) return
      handlers?.onStatus('connected')
      while (pending.length > 0 && socket?.readyState === WebSocket.OPEN) {
        socket.send(pending.shift() as string)
      }
    })
    activeSocket.addEventListener('message', (event) => {
      if (socketGeneration !== generation) return
      try {
        const value: unknown = JSON.parse(String(event.data))
        if (isMessage(value) && value.roomId === roomId) handlers?.onMessage(value)
      } catch (error) {
        handlers?.onError(error)
      }
    })
    activeSocket.addEventListener('error', (event) => {
      if (socketGeneration === generation) handlers?.onError(event)
    })
    activeSocket.addEventListener('close', () => {
      if (manuallyClosed || socketGeneration !== generation) return
      handlers?.onStatus('reconnecting')
      reconnectTimer = window.setTimeout(connectSocket, reconnectDelayMs)
    })
  }

  return {
    connect(nextRoomId, nextClientId, nextHandlers) {
      roomId = nextRoomId
      clientId = nextClientId
      handlers = nextHandlers
      manuallyClosed = false
      connectSocket()
    },
    send(message) {
      const payload = JSON.stringify(message)
      if (socket?.readyState === WebSocket.OPEN) socket.send(payload)
      else pending.push(payload)
    },
    disconnect() {
      manuallyClosed = true
      generation += 1
      window.clearTimeout(reconnectTimer)
      socket?.close()
      socket = null
      pending.length = 0
      handlers?.onStatus('disconnected')
      handlers = null
    },
  }
}
