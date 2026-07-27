import type { IntelligenceDocumentType } from '../types/documentModel'

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg'])

export const DOCUMENT_INTELLIGENCE_ACCEPT =
  '.pdf,.docx,.txt,.md,.markdown,.png,.jpg,.jpeg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,image/png,image/jpeg'

export const MAX_INTELLIGENCE_FILE_SIZE = 25 * 1024 * 1024

export function classifyDocument(file: File): IntelligenceDocumentType | null {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (IMAGE_TYPES.has(file.type) || extension === 'png' || extension === 'jpg' || extension === 'jpeg') {
    return 'image'
  }
  if (file.type === 'application/pdf' || extension === 'pdf') return 'pdf'
  if (extension === 'docx') return 'docx'
  if (extension === 'md' || extension === 'markdown') return 'markdown'
  if (file.type === 'text/plain' || extension === 'txt') return 'text'
  return null
}

export function validateIntelligenceFile(file: File): string | null {
  if (!classifyDocument(file)) {
    return 'Choose a PDF, DOCX, TXT, Markdown, PNG, or JPEG file.'
  }
  if (file.size === 0) return 'This file is empty.'
  if (file.size > MAX_INTELLIGENCE_FILE_SIZE) {
    return 'Choose a file smaller than 25 MB.'
  }
  return null
}
