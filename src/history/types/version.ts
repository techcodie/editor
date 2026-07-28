import type { EditorDocumentNode } from '../../lib/editor-api'

export interface VersionAuthor {
  id: string
  name: string
}

export type VersionSource = 'manual' | 'recovery' | 'workflow' | 'collaboration'
export type SnapshotEncoding = 'full' | 'delta'
export type SnapshotCompression = 'gzip' | 'none'

export interface VersionSnapshot {
  formatVersion: 1
  encoding: SnapshotEncoding
  compression: SnapshotCompression
  data: string
  baseVersionId?: string
  byteLength: number
  uncompressedLength: number
}

export interface VersionSnapshotContent {
  document: EditorDocumentNode
  text: string
}

export interface VersionMetadata {
  reason: string
  comments: string
  source: VersionSource
  wordCount: number
  characterCount: number
  snapshotBytes: number
  bookmarked: boolean
  favorite: boolean
  parentVersionId?: string
}

export interface Version {
  id: string
  name: string
  description: string
  createdAt: number
  author: VersionAuthor
  documentHash: string
  snapshot: VersionSnapshot
  metadata: VersionMetadata
}

export interface CreateVersionInput {
  name: string
  description?: string
  reason?: string
  comments?: string
  author: VersionAuthor
  source?: VersionSource
  content: VersionSnapshotContent
}
