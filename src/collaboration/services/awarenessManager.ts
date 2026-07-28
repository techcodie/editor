import type { EditorApi } from '../../lib/editor-api'
import type { AwarenessState, CollaborationUser } from '../types/presence'

export function readAwareness(
  api: EditorApi,
  user: CollaborationUser,
  clientId: string,
  typing: boolean,
): AwarenessState {
  const selection = api.getSelectionRange()
  return {
    user,
    clientId,
    cursor: selection?.to ?? null,
    selection: selection && selection.from !== selection.to ? selection : null,
    status: document.visibilityState === 'hidden' ? 'away' : 'online',
    typing,
    lastSeen: Date.now(),
  }
}

export function createThrottledAwarenessPublisher(
  interval: number,
  publish: () => void,
): { schedule(): void; flush(): void; cancel(): void } {
  let timer: number | undefined
  let lastPublishedAt = 0

  const flush = () => {
    window.clearTimeout(timer)
    timer = undefined
    lastPublishedAt = Date.now()
    publish()
  }

  return {
    schedule() {
      const remaining = interval - (Date.now() - lastPublishedAt)
      if (remaining <= 0) flush()
      else if (timer === undefined) timer = window.setTimeout(flush, remaining)
    },
    flush,
    cancel() {
      window.clearTimeout(timer)
      timer = undefined
    },
  }
}
