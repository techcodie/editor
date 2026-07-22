import { useEffect, useRef } from 'react'
import { CircleAlert } from 'lucide-react'
import { ChatMessage } from './ChatMessage'
import { EmptyState } from './EmptyState'
import { LoadingState } from './LoadingState'
import type { ChatMessage as ChatMessageType } from './types'

interface ChatConversationProps {
  messages: ChatMessageType[]
  isLoading: boolean
  error: string | null
  onSelectSuggestion: (prompt: string) => void
}
export function ChatConversation({
  messages,
  isLoading,
  error,
  onSelectSuggestion,
}: ChatConversationProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, isLoading, error])

  return (
    <div
      className="min-h-0 flex-1 overflow-y-auto bg-neutral-50/70 px-4 py-4"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Ask Document conversation"
    >
      {messages.length === 0 && !error ? (
        <EmptyState disabled={isLoading} onSelectSuggestion={onSelectSuggestion} />
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && <LoadingState />}
          {error && (
            <div
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700"
              role="alert"
            >
              <CircleAlert size={15} className="mt-0.5 shrink-0" aria-hidden />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
      <div ref={endRef} />
    </div>
  )
}
