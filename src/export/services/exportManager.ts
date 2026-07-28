import { renderDocument } from './documentRenderer'
import { sanitizeRenderedDocument } from '../../redaction/services/exportSanitizer'
import type {
  ExportRequest,
  ExportResult,
  ExportStatus,
} from '../types/export'

export interface ExportProgressUpdate {
  status: ExportStatus
  progress: number
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 0))
}

export async function runExport(
  request: ExportRequest,
  onProgress: (update: ExportProgressUpdate) => void,
): Promise<ExportResult> {
  onProgress({ status: 'rendering', progress: 20 })
  await yieldToBrowser()
  const rendered = sanitizeRenderedDocument(
    renderDocument(request),
    request.source.redactions,
  )

  onProgress({ status: 'generating', progress: 52 })
  await yieldToBrowser()
  const result = request.format === 'pdf'
    ? await import('./pdfExporter').then((module) => module.exportPdf(rendered))
    : request.format === 'docx'
      ? await import('./docxExporter').then((module) => module.exportDocx(rendered))
      : await import('./htmlExporter').then((module) => module.exportHtml(rendered))

  onProgress({ status: 'finalizing', progress: 88 })
  await yieldToBrowser()
  onProgress({ status: 'completed', progress: 100 })
  return result
}

export function downloadExport(result: ExportResult): void {
  const url = URL.createObjectURL(result.blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = result.fileName
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

export function estimateExportSize(request: ExportRequest): number {
  const documentBytes = new Blob([JSON.stringify(request.source.document)]).size
  const imageBytes = request.options.includeAssets
    ? JSON.stringify(request.source.document).match(/data:image\//g)?.length ?? 0
    : 0
  const multiplier = request.format === 'html' ? 1.25 : request.format === 'docx' ? 0.7 : 0.55
  return Math.max(4_096, Math.round(documentBytes * multiplier + imageBytes * 24_000))
}

export function formatBytes(bytes: number): string {
  if (bytes < 1_024) return `${bytes} B`
  if (bytes < 1_048_576) return `${Math.max(1, Math.round(bytes / 1_024))} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}
