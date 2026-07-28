import type { Version } from './version'

export type HistoryFilter = 'all' | 'bookmarked' | 'favorites' | 'manual' | 'recovery'
export type HistorySort = 'newest' | 'oldest' | 'name'

export interface HistoryState {
  versions: Version[]
  loaded: boolean
  saving: boolean
  error: string | null
}

export interface HistoryStoragePayload {
  formatVersion: 1
  updatedAt: number
  versions: Version[]
}

export interface HistoryStorageAdapter {
  load(): Promise<Version[]>
  save(versions: Version[]): Promise<void>
  clear(): Promise<void>
}

export interface VersionGroup {
  id: string
  label: string
  versions: Version[]
}
