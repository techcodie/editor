export type KnowledgeSourceType = 'document' | 'pdf' | 'docx' | 'txt' | 'markdown'
export type KnowledgeSourceStatus = 'current' | 'uploaded'

export interface KnowledgeSource {
  id: string
  name: string
  type: KnowledgeSourceType
  size: number
  status: KnowledgeSourceStatus
}

export const CURRENT_DOCUMENT_SOURCE: KnowledgeSource = {
  id: 'current-document',
  name: 'Current Document',
  type: 'document',
  size: 0,
  status: 'current',
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

export function getKnowledgeSourceType(file: File): KnowledgeSourceType | null {
  const extension = file.name.split('.').pop()?.toLowerCase()
  return extension ? (SOURCE_TYPE_BY_EXTENSION[extension] ?? null) : null
}

export function getKnowledgeSourceLabel(type: KnowledgeSourceType): string {
  switch (type) {
    case 'document':
      return 'Editor'
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
