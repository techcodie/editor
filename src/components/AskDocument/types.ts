export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  timestamp: number
  role: ChatRole
  content: string
}
