import type { LayoutBlock, LayoutSummary } from './layout'

export type IntelligenceDocumentType =
  | 'image'
  | 'pdf'
  | 'docx'
  | 'text'
  | 'markdown'

export interface DocumentMetadata {
  fileName: string
  fileType: IntelligenceDocumentType
  mimeType: string
  fileSize: number
  title: string
  author?: string
  keywords: string[]
  language: string
  createdAt?: string
  modifiedAt?: string
  pageCount: number
}

export interface SearchIndexEntry {
  term: string
  occurrences: number
  blockIds: string[]
}

export interface DocumentSearchIndex {
  entries: SearchIndexEntry[]
  searchableText: string
  indexedAt: string
}

export interface DocumentPage {
  pageNumber: number
  width: number
  height: number
  text: string
  confidence: number
  usedOCR: boolean
  blocks: LayoutBlock[]
}

export interface DocumentModel {
  id: string
  pages: DocumentPage[]
  blocks: LayoutBlock[]
  paragraphs: LayoutBlock[]
  tables: LayoutBlock[]
  images: LayoutBlock[]
  metadata: DocumentMetadata
  text: string
  language: string
  confidence: number
  layout: LayoutSummary
  searchIndex: DocumentSearchIndex
  aiContext: string
}

export type DocumentImportStage =
  | 'idle'
  | 'analyzing'
  | 'ocr'
  | 'layout'
  | 'metadata'
  | 'indexing'
  | 'complete'
  | 'error'
  | 'cancelled'

export interface DocumentImportProgress {
  stage: DocumentImportStage
  progress: number
  message: string
  page?: number
  pageCount?: number
}

export interface DocumentIntelligenceOptions {
  language?: string
  signal?: AbortSignal
  onProgress?: (progress: DocumentImportProgress) => void
}
