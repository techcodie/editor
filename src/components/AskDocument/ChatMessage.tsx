import { Sparkles } from 'lucide-react'
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
      <div className="my-1 text-center text-[11px] leading-4 text-neutral-400" role="status">
        {message.content}
      </div>
    )
  }

  const isUser = message.role === 'user'

  return (
    <article
      aria-label={`${isUser ? 'You' : 'Assistant'} at ${TIME_FORMATTER.format(message.timestamp)}`}
      className={cn(
        'flex gap-2.5 [animation:ask-message-in_180ms_ease-out]',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {!isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600">
          <Sparkles size={14} strokeWidth={1.9} aria-hidden />
        </div>
      )}
      <div className={cn('min-w-0 max-w-[85%]', isUser && 'text-right')}>
        <div
          className={cn(
            'whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-left text-sm leading-5',
            isUser
              ? 'rounded-br-sm bg-neutral-900 text-white'
              : 'rounded-bl-sm border border-neutral-200 bg-white text-neutral-700 shadow-sm',
          )}
        >
          {message.content}
        </div>
        <time
          dateTime={new Date(message.timestamp).toISOString()}
          className="mt-1 inline-block px-1 text-[10px] text-neutral-400"
        >
          {TIME_FORMATTER.format(message.timestamp)}
        </time>
      </div>
    </article>
  )
}
