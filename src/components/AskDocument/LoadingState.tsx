import { Sparkles } from 'lucide-react'

export function LoadingState() {
  return (
    <div
      className="flex gap-2.5 [animation:ask-message-in_180ms_ease-out]"
      role="status"
      aria-label="Assistant is thinking"
    >
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600">
        <Sparkles size={14} strokeWidth={1.9} aria-hidden />
      </div>
      <div className="w-[72%] rounded-xl rounded-bl-sm border border-neutral-200 bg-white px-3 py-3 shadow-sm">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-160ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-80ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" />
        </div>
      </div>
    </div>
  )
}
