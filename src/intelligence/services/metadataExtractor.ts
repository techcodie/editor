import type {
  DocumentMetadata,
  IntelligenceDocumentType,
} from '../types/documentModel'

interface MetadataHints {
  title?: string
  author?: string
  keywords?: string[]
  createdAt?: string
  modifiedAt?: string
}

function normalizeDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const pdfDate = /^D:(\d{4})(\d{2})(\d{2})/.exec(value)
  if (pdfDate) return `${pdfDate[1]}-${pdfDate[2]}-${pdfDate[3]}`
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export function extractMetadata(
  file: File,
  fileType: IntelligenceDocumentType,
  pageCount: number,
  language: string,
  hints: MetadataHints = {},
): DocumentMetadata {
  const baseName = file.name.replace(/\.[^.]+$/, '').trim() || 'Untitled document'
  return {
    fileName: file.name,
    fileType,
    mimeType: file.type || 'application/octet-stream',
    fileSize: file.size,
    title: hints.title?.trim() || baseName,
    author: hints.author?.trim() || undefined,
    keywords: (hints.keywords ?? []).map((keyword) => keyword.trim()).filter(Boolean),
    language,
    createdAt: normalizeDate(hints.createdAt),
    modifiedAt: normalizeDate(hints.modifiedAt) ?? new Date(file.lastModified).toISOString(),
    pageCount,
  }
}
