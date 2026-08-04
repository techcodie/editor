import { Sparkles, Square } from 'lucide-react'

interface LoadingStateProps {
  onCancel: () => void
}

export function LoadingState({ onCancel }: LoadingStateProps) {
  return (
    <div
      className="flex gap-2.5 [animation:ask-message-in_200ms_ease-out]"
      role="status"
      aria-label="Assistant is thinking"
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-white shadow-sm">
        <Sparkles size={14} strokeWidth={1.9} aria-hidden />
      </div>
      <div className="w-[72%] rounded-lg rounded-bl-sm border border-neutral-200 bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(20,20,20,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 [animation:ai-thinking-dot_1.1s_ease-in-out_infinite]" />
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 [animation:ai-thinking-dot_1.1s_ease-in-out_120ms_infinite]" />
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 [animation:ai-thinking-dot_1.1s_ease-in-out_240ms_infinite]" />
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[10px] font-semibold text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
          >
            <Square size={9} fill="currentColor" aria-hidden />
            Stop
          </button>
        </div>
      </div>
    </div>
  )
}
