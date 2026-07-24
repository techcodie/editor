import { useEffect, useRef } from 'react'
import { CircleAlert, RotateCcw } from 'lucide-react'
import { ChatMessage } from './ChatMessage'
import { EmptyState } from './EmptyState'
import { LoadingState } from './LoadingState'
import type { EditorInsertionFeedback } from '../../editor/hooks/useEditorInsertion'
import type { AiResponseInsertion } from '../../editor/services/editorInsertion'
import type { EditorInsertionTarget } from '../../lib/editor-api'
import type { ChatMessage as ChatMessageType, ConversationError } from './types'

interface ChatConversationProps {
  messages: ChatMessageType[]
  isLoading: boolean
  error: ConversationError | null
  onSelectSuggestion: (prompt: string) => void
  onRetry: () => void
  regeneratableMessageId: string | null
  previewableSourceIds: ReadonlySet<string>
  onRegenerate: (messageId: string) => void
  onOpenSource: (sourceId: string) => void
  canInsert: boolean
  canReplaceSelection: boolean
  insertionFeedback: EditorInsertionFeedback | null
  onInsertResponse: (
    response: AiResponseInsertion,
    target: Exclude<EditorInsertionTarget, 'selection'>,
  ) => void
  onRequestReplacement: (response: AiResponseInsertion) => void
}
export function ChatConversation({
  messages,
  isLoading,
  error,
  onSelectSuggestion,
  onRetry,
  regeneratableMessageId,
  previewableSourceIds,
  onRegenerate,
  onOpenSource,
  canInsert,
  canReplaceSelection,
  insertionFeedback,
  onInsertResponse,
  onRequestReplacement,
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
      className="min-h-0 flex-1 scroll-smooth overflow-y-auto bg-[#fafaf9] px-4 py-5"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Ask Document conversation"
      onScroll={updateScrollPreference}
    >
      {messages.length === 0 && !error ? (
        <EmptyState disabled={isLoading} onSelectSuggestion={onSelectSuggestion} />
      ) : (
        <div className="space-y-5">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              canRegenerate={message.id === regeneratableMessageId && !isLoading}
              previewableSourceIds={previewableSourceIds}
              onRegenerate={onRegenerate}
              onOpenSource={onOpenSource}
              canInsert={canInsert}
              canReplaceSelection={canReplaceSelection}
              insertionFeedback={
                insertionFeedback?.responseId === message.id
                  ? insertionFeedback
                  : null
              }
              onInsertResponse={onInsertResponse}
              onRequestReplacement={onRequestReplacement}
            />
          ))}
          {isLoading && messages.at(-1)?.role !== 'assistant' && <LoadingState />}
          {error && (
            <div
              className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/80 px-3.5 py-3 text-xs leading-5 text-red-700 shadow-[0_1px_2px_rgba(127,29,29,0.04)]"
              role="alert"
            >
              <CircleAlert size={15} className="mt-0.5 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p>{error.message}</p>
                {error.canRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-2 inline-flex h-7 items-center gap-1.5 rounded-md bg-white px-2.5 font-semibold text-red-800 shadow-sm ring-1 ring-inset ring-red-200 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
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
