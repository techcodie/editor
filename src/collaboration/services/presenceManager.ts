import type { AwarenessState, Collaborator } from '../types/presence'

const STALE_AFTER_MS = 45_000

export class PresenceManager {
  readonly #collaborators = new Map<string, Collaborator>()

  update(awareness: AwarenessState): void {
    this.#collaborators.set(awareness.clientId, {
      ...awareness.user,
      clientId: awareness.clientId,
      cursor: awareness.cursor,
      selection: awareness.selection,
      status: awareness.status,
      typing: awareness.typing,
      lastSeen: awareness.lastSeen,
    })
  }

  remove(clientId: string): void {
    this.#collaborators.delete(clientId)
  }

  list(now = Date.now()): Collaborator[] {
    return [...this.#collaborators.values()]
      .map((collaborator) => now - collaborator.lastSeen > STALE_AFTER_MS
        ? { ...collaborator, status: 'offline' as const, typing: false }
        : collaborator)
      .toSorted((left, right) => {
        if (left.status !== right.status) return left.status === 'online' ? -1 : 1
        return left.name.localeCompare(right.name)
      })
  }
}
