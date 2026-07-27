export const ASK_DOCUMENT_HISTORY_LIMIT = 8
export const CURRENT_DOCUMENT_SOURCE_ID = 'current-document'

export type AskDocumentHistoryRole = 'user' | 'assistant'
export type AskDocumentSourceType =
  | 'document'
  | 'pdf'
  | 'docx'
  | 'txt'
  | 'markdown'
  | 'image'

export interface AskDocumentHistoryMessage {
  role: AskDocumentHistoryRole
  content: string
}

export interface AskDocumentSourceMetadata {
  id: string
  name: string
  type: AskDocumentSourceType
  pageCount?: number
}

export interface AskDocumentKnowledgeSource extends AskDocumentSourceMetadata {
  content: string
}

export interface AskDocumentRequest {
  currentDocument: string
  activeKnowledgeSources: AskDocumentKnowledgeSource[]
  conversation: AskDocumentHistoryMessage[]
  userQuestion: string
}

export interface AskDocumentResponseMetadata {
  model: string
  sources: AskDocumentSourceMetadata[]
  contextSize: number
}
