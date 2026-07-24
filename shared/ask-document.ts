export const ASK_DOCUMENT_HISTORY_LIMIT = 8

export type AskDocumentHistoryRole = 'user' | 'assistant'

export interface AskDocumentHistoryMessage {
  role: AskDocumentHistoryRole
  content: string
}

export interface AskDocumentKnowledgeSource {
  name: string
  content: string
}

export interface AskDocumentRequest {
  currentDocument: string
  activeKnowledgeSources: AskDocumentKnowledgeSource[]
  conversation: AskDocumentHistoryMessage[]
  userQuestion: string
}
