import { FileQuestion } from 'lucide-react'
import { SuggestedActions } from './SuggestedActions'

interface EmptyStateProps {
  disabled?: boolean
  onSelectSuggestion: (prompt: string) => void
}
export function EmptyState({ disabled, onSelectSuggestion }: EmptyStateProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-1 py-10 text-center">
      <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm">
        <FileQuestion size={23} strokeWidth={1.8} aria-hidden />
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
      </div>
      <h3 className="text-sm font-semibold text-neutral-900">Ask anything about this document.</h3>
      <p className="mt-1.5 max-w-[17rem] text-xs leading-5 text-neutral-500">
        The assistant only answers using the current document.
      </p>
      <p className="mb-2.5 mt-6 w-full text-left text-[11px] font-semibold uppercase text-neutral-400">
        Try asking
      </p>
      <SuggestedActions disabled={disabled} onSelect={onSelectSuggestion} />
    </div>
  )
}
