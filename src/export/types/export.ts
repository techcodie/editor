import type { EditorDocumentNode } from '../../lib/editor-api'
import type { PageLayout } from '../../layout/types/layout'
import type { PaginationSnapshot } from '../../layout/types/page'
import type { Comment } from '../../review/types/comment'
import type { TrackChange } from '../../review/trackChanges/types/trackChange'
import type { Watermark } from '../../watermark/types/watermark'

export type ExportFormat = 'pdf' | 'docx' | 'html'
export type ExportStatus =
  | 'queued'
  | 'rendering'
  | 'generating'
  | 'finalizing'
  | 'completed'
  | 'failed'

export interface ExportOptions {
  includeComments: boolean
  includeTrackChanges: boolean
  includeWatermarks: boolean
  includeAssets: boolean
  flattenSuggestions: boolean
  exportMetadata: boolean
}

export interface ExportResult {
  blob: Blob
  fileName: string
  mimeType: string
  size: number
}

export interface ExportJob {
  id: string
  format: ExportFormat
  status: ExportStatus
  createdAt: number
  options: ExportOptions
  progress: number
  result: ExportResult | null
  error: string | null
}

export interface ExportSource {
  title: string
  document: EditorDocumentNode
  text: string
  layout: PageLayout
  pagination: PaginationSnapshot
  watermark: Watermark | null
  comments: Comment[]
  trackChanges: TrackChange[]
}

export interface ExportRequest {
  format: ExportFormat
  options: ExportOptions
  source: ExportSource
}

export interface RenderedMark {
  type: string
  attrs: Record<string, unknown>
}

export interface RenderedText {
  text: string
  marks: RenderedMark[]
}

export interface RenderedAsset {
  title: string
  width: number
  height: number
  rotation: number
  svg: string
  renderData: Record<string, unknown>
}

export interface RenderedTableCell {
  blocks: RenderedBlock[]
}

export interface RenderedBlock {
  id: string
  type: string
  level: number
  position: number
  runs: RenderedText[]
  text: string
  checked?: boolean
  asset?: RenderedAsset
  rows?: RenderedTableCell[][]
}

export interface RenderedPage {
  number: number
  blocks: RenderedBlock[]
}

export interface RenderedDocument {
  title: string
  createdAt: number
  currentPage: number
  layout: PageLayout
  watermark: Watermark | null
  options: ExportOptions
  pages: RenderedPage[]
  blocks: RenderedBlock[]
  comments: Comment[]
  trackChanges: TrackChange[]
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  includeComments: false,
  includeTrackChanges: false,
  includeWatermarks: true,
  includeAssets: true,
  flattenSuggestions: true,
  exportMetadata: true,
}

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf: 'PDF',
  docx: 'DOCX',
  html: 'HTML Archive',
}
