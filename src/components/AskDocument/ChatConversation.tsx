import { useEffect, useRef } from 'react'
import { CircleAlert, RotateCcw } from 'lucide-react'
import { ChatMessage } from './ChatMessage'
import { EmptyState } from './EmptyState'
import { LoadingState } from './LoadingState'
import type { ChatMessage as ChatMessageType, ConversationError } from './types'

interface ChatConversationProps {
  messages: ChatMessageType[]
  isLoading: boolean
  error: ConversationError | null
  onSelectSuggestion: (prompt: string) => void
  onRetry: () => void
}
export function ChatConversation({
  messages,
  isLoading,
  error,
  onSelectSuggestion,
  onRetry,
}: ChatConversationProps) {
  const conversationRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const shouldStickToBottomRef = useRef(true)
  const wasLoadingRef = useRef(false)

  useEffect(() => {
    if (isLoading && !wasLoadingRef.current) shouldStickToBottomRef.current = true
    wasLoadingRef.current = isLoading
  }, [isLoading])

  useEffect(() => {
    if (shouldStickToBottomRef.current) {
      endRef.current?.scrollIntoView({ behavior: isLoading ? 'auto' : 'smooth', block: 'nearest' })
    }
  }, [messages, isLoading, error])

  const updateScrollPreference = () => {
    const conversation = conversationRef.current
    if (!conversation) return
    const distanceFromBottom =
      conversation.scrollHeight - conversation.clientHeight - conversation.scrollTop
    shouldStickToBottomRef.current = distanceFromBottom < 48
  }

  return (
    <div
      ref={conversationRef}
      className="min-h-0 flex-1 overflow-y-auto bg-neutral-50/70 px-4 py-4"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Ask Document conversation"
      onScroll={updateScrollPreference}
    >
      {messages.length === 0 && !error ? (
        <EmptyState disabled={isLoading} onSelectSuggestion={onSelectSuggestion} />
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && messages.at(-1)?.role !== 'assistant' && <LoadingState />}
          {error && (
            <div
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700"
              role="alert"
            >
              <CircleAlert size={15} className="mt-0.5 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p>{error.message}</p>
                {error.canRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-1.5 inline-flex items-center gap-1 font-semibold text-red-800 underline decoration-red-300 underline-offset-2 hover:decoration-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                  >
                    <RotateCcw size={12} strokeWidth={2} aria-hidden />
                    Retry
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <div ref={endRef} />
    </div>
  )
}
