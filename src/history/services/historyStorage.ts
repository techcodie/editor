import type { HistoryStorageAdapter, HistoryStoragePayload } from '../types/history'
import type { Version } from '../types/version'

const STORAGE_PREFIX = 'techcodie:editor:history:v1'
export const HISTORY_STORAGE_EVENT = 'techcodie:history-storage'

function validVersions(value: unknown): Version[] {
  if (!value || typeof value !== 'object' || !('versions' in value)) return []
  const payload = value as Partial<HistoryStoragePayload>
  if (payload.formatVersion !== 1 || !Array.isArray(payload.versions)) return []
  return payload.versions.filter((version) =>
    Boolean(version?.id && version?.name && version?.snapshot?.formatVersion === 1),
  ) as Version[]
}

export function createHistoryStorage(namespace = 'default'): HistoryStorageAdapter {
  const key = `${STORAGE_PREFIX}:${namespace}`
  let memory: Version[] = []
  return {
    async load() {
      try {
        const value = window.localStorage.getItem(key)
        if (!value) return structuredClone(memory)
        memory = validVersions(JSON.parse(value))
      } catch {
        // Browser storage can be unavailable in private or embedded contexts.
      }
      return structuredClone(memory)
    },
    async save(versions) {
      memory = structuredClone(versions)
      const payload: HistoryStoragePayload = {
        formatVersion: 1,
        updatedAt: Date.now(),
        versions: memory,
      }
      try {
        window.localStorage.setItem(key, JSON.stringify(payload))
        window.dispatchEvent(new CustomEvent(HISTORY_STORAGE_EVENT, { detail: { key } }))
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          throw new Error('Local version storage is full. Export or remove older versions.')
        }
      }
    },
    async clear() {
      memory = []
      try { window.localStorage.removeItem(key) } catch { /* Memory remains available. */ }
      window.dispatchEvent(new CustomEvent(HISTORY_STORAGE_EVENT, { detail: { key } }))
    },
  }
}

export function historyNamespace(value: string): string {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index) | 0
  }
  return (hash >>> 0).toString(36)
}
