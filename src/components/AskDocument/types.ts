export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  timestamp: number
  role: ChatRole
  content: string
  sourcesUsed?: string[]
}

export interface ConversationError {
  message: string
  canRetry: boolean
}
