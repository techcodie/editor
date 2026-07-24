import { Check, Sparkles } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { ChatMessage as ChatMessageType } from './types'

interface ChatMessageProps {
  message: ChatMessageType
}
const TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
})

export function ChatMessage({ message }: ChatMessageProps) {
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
        {!isUser && message.sourcesUsed && message.sourcesUsed.length > 0 && (
          <div
            className="mb-1.5 rounded-md border border-neutral-200 bg-neutral-100/70 px-2.5 py-2 text-left"
            aria-label="Sources used for this response"
          >
            <p className="text-[9px] font-semibold uppercase text-neutral-500">Using Sources</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {message.sourcesUsed.map((sourceName, index) => (
                <span
                  key={`${sourceName}-${index}`}
                  className="inline-flex max-w-full items-center gap-1 rounded-md bg-white px-1.5 py-1 text-[9px] font-medium text-neutral-600 shadow-sm ring-1 ring-inset ring-neutral-200"
                >
                  <Check size={10} strokeWidth={2.2} className="shrink-0 text-emerald-600" aria-hidden />
                  <span className="truncate">{sourceName}</span>
                </span>
              ))}
            </div>
          </div>
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
        <time
          dateTime={new Date(message.timestamp).toISOString()}
          className="mt-1.5 inline-block px-0.5 text-[10px] text-neutral-400"
        >
          {TIME_FORMATTER.format(message.timestamp)}
        </time>
      </div>
    </article>
  )
}
