import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../lib/cn'
import type { EditorInsertionFeedback } from '../../editor/hooks/useEditorInsertion'
import type { AiResponseInsertion } from '../../editor/services/editorInsertion'
import type { EditorInsertionTarget } from '../../lib/editor-api'
import { EvidenceList } from './EvidenceList'
import { ResponseActions } from './ResponseActions'
import { SourceBadges } from './SourceBadges'
import type { ChatMessage as ChatMessageType } from './types'

interface ChatMessageProps {
  message: ChatMessageType
  canRegenerate: boolean
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
const TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
})

export function ChatMessage({
  message,
  canRegenerate,
  previewableSourceIds,
  onRegenerate,
  onOpenSource,
  canInsert,
  canReplaceSelection,
  insertionFeedback,
  onInsertResponse,
  onRequestReplacement,
}: ChatMessageProps) {
  const [isEvidenceVisible, setIsEvidenceVisible] = useState(true)
  if (message.role === 'system') {
    return (
      <div className="my-1 flex items-center gap-2 text-[10px] font-medium text-neutral-400" role="status">
        <span className="h-px flex-1 bg-neutral-200" />
        <span>{message.content}</span>
        <span className="h-px flex-1 bg-neutral-200" />
      </div>
    )
  }

  const isUser = message.role === 'user'
  const sources = message.metadata?.sources ?? []
  const firstPreviewableSource = sources.find((source) =>
    previewableSourceIds.has(source.id),
  )
  const insertionResponse: AiResponseInsertion = {
    responseId: message.id,
    content: message.content,
    sourceIds: sources.map((source) => source.id),
  }

  return (
    <article
      aria-label={`${isUser ? 'You' : 'Assistant'} at ${TIME_FORMATTER.format(message.timestamp)}`}
      className={cn(
        'flex gap-2.5 [animation:ask-message-in_200ms_ease-out]',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {!isUser && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-white shadow-sm">
          <Sparkles size={14} strokeWidth={1.9} aria-hidden />
        </div>
      )}
      <div className={cn('min-w-0 max-w-[88%]', isUser && 'text-right')}>
        {!isUser && sources.length > 0 && (
          <SourceBadges
            sources={sources}
            previewableSourceIds={previewableSourceIds}
            onOpenSource={onOpenSource}
          />
        )}
        <div
          className={cn(
            'whitespace-pre-wrap break-words rounded-lg px-3.5 py-2.5 text-left text-sm leading-6',
            isUser
              ? 'rounded-br-sm bg-neutral-900 text-white shadow-[0_4px_14px_-8px_rgba(23,23,23,0.65)]'
              : 'rounded-bl-sm border border-neutral-200 bg-white text-neutral-700 shadow-[0_1px_2px_rgba(20,20,20,0.04),0_8px_18px_-14px_rgba(20,20,20,0.22)]',
          )}
        >
          {message.content}
        </div>
        {!isUser && isEvidenceVisible && sources.length > 0 && (
          <EvidenceList
            sources={sources}
            previewableSourceIds={previewableSourceIds}
            onOpenSource={onOpenSource}
          />
        )}
        <time
          dateTime={new Date(message.timestamp).toISOString()}
          className="mt-1.5 inline-block px-0.5 text-[10px] text-neutral-400"
        >
          {TIME_FORMATTER.format(message.timestamp)}
        </time>
        {!isUser && message.metadata && (
          <ResponseActions
            content={message.content}
            canInsert={canInsert}
            canReplaceSelection={canReplaceSelection}
            canRegenerate={canRegenerate}
            hasPreviewableSource={Boolean(firstPreviewableSource)}
            previewSourceName={firstPreviewableSource?.name}
            isEvidenceVisible={isEvidenceVisible}
            insertionFeedback={insertionFeedback}
            onInsertAtCursor={() => onInsertResponse(insertionResponse, 'cursor')}
            onReplaceSelection={() => onRequestReplacement(insertionResponse)}
            onAppendToEnd={() => onInsertResponse(insertionResponse, 'end')}
            onRegenerate={() => onRegenerate(message.id)}
            onToggleEvidence={() => setIsEvidenceVisible((isVisible) => !isVisible)}
            onOpenPreview={() => {
              if (firstPreviewableSource) onOpenSource(firstPreviewableSource.id)
            }}
          />
        )}
      </div>
    </article>
  )
}
