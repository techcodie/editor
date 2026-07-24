import type { AskDocumentResponseMetadata } from '../../../shared/ask-document'

export type ChatRole = 'user' | 'assistant' | 'system'

export interface AssistantResponseMetadata extends AskDocumentResponseMetadata {
  responseTime?: number
}

export interface ChatMessage {
  id: string
  timestamp: number
  role: ChatRole
  content: string
  metadata?: AssistantResponseMetadata
}

export interface ConversationError {
  message: string
  canRetry: boolean
}
