import {
  CURRENT_DOCUMENT_SOURCE_ID,
  type AskDocumentSourceType,
} from '../../../shared/ask-document'

export type KnowledgeSourceType = AskDocumentSourceType
export type KnowledgeSourceStatus = 'current' | 'uploaded'
export type KnowledgeSourceParseStatus = 'idle' | 'parsing' | 'ready' | 'error'

export interface KnowledgeSource {
  id: string
  name: string
  type: KnowledgeSourceType
  size: number
  status: KnowledgeSourceStatus
  isActive: boolean
  file?: File
  parseStatus: KnowledgeSourceParseStatus
  parsedContent?: string
  previewHtml?: string
  pageCount?: number
  errorMessage?: string
}

export interface PreparedKnowledgeSource {
  name: string
  type: Exclude<KnowledgeSourceType, 'document'>
  size: number
  text: string
  file?: File
  html?: string
  pageCount?: number
}

export const CURRENT_DOCUMENT_SOURCE: KnowledgeSource = {
  id: CURRENT_DOCUMENT_SOURCE_ID,
  name: 'Current Document',
  type: 'document',
  size: 0,
  status: 'current',
  isActive: true,
  parseStatus: 'idle',
}

const SOURCE_TYPE_BY_EXTENSION: Record<string, KnowledgeSourceType> = {
  pdf: 'pdf',
  docx: 'docx',
  txt: 'txt',
  md: 'markdown',
  markdown: 'markdown',
}

export const KNOWLEDGE_SOURCE_ACCEPT =
  '.pdf,.docx,.txt,.md,.markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown'

export const MAX_KNOWLEDGE_SOURCE_SIZE = 25 * 1024 * 1024

export function getKnowledgeSourceType(file: File): KnowledgeSourceType | null {
  const extension = file.name.split('.').pop()?.toLowerCase()
  return extension ? (SOURCE_TYPE_BY_EXTENSION[extension] ?? null) : null
}

export function validateKnowledgeSourceFile(file: File): string | null {
  if (!getKnowledgeSourceType(file)) {
    return `${file.name} is unsupported. Choose a PDF, DOCX, TXT, or Markdown file.`
  }
  if (file.size === 0) {
    return `${file.name} is empty. Choose a file with readable content.`
  }
  if (file.size > MAX_KNOWLEDGE_SOURCE_SIZE) {
    return `${file.name} is too large. Choose a file smaller than 25 MB.`
  }
  return null
}

export function getKnowledgeSourceLabel(type: KnowledgeSourceType): string {
  switch (type) {
    case 'document':
      return 'Editor'
    case 'image':
      return 'Image OCR'
    case 'markdown':
      return 'Markdown'
    default:
      return type.toUpperCase()
  }
}

export function formatKnowledgeSourceSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(size < 10 * 1024 ? 1 : 0)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
