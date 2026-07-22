export const ASK_DOCUMENT_HISTORY_LIMIT = 8

export type AskDocumentHistoryRole = 'user' | 'assistant'

export interface AskDocumentHistoryMessage {
  role: AskDocumentHistoryRole
  content: string
}

export interface AskDocumentRequest {
  document: string
  question: string
  history: AskDocumentHistoryMessage[]
}

export type AskDocumentStreamEvent =
  | { type: 'delta'; content: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

export interface AskDocumentErrorResponse {
  error: string
}
