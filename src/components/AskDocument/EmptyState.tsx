import { FileQuestion } from 'lucide-react'
import { SuggestedActions } from './SuggestedActions'

interface EmptyStateProps {
  disabled?: boolean
  onSelectSuggestion: (prompt: string) => void
}
export function EmptyState({ disabled, onSelectSuggestion }: EmptyStateProps) {
  return (
    <div className="flex min-h-full flex-col items-center px-1 py-8 text-center [justify-content:safe_center]">
      <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-800 shadow-[0_1px_2px_rgba(20,20,20,0.04),0_10px_24px_-16px_rgba(20,20,20,0.3)]">
        <FileQuestion size={22} strokeWidth={1.8} aria-hidden />
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#fafaf9] bg-emerald-500" />
      </div>
      <h3 className="text-sm font-semibold text-neutral-950">Ask about your document</h3>
      <p className="mt-1.5 max-w-[17rem] text-xs leading-5 text-neutral-500">
        The assistant only answers using the current document.
      </p>
      <p className="mb-2.5 mt-7 w-full text-left text-[11px] font-medium text-neutral-500">
        Suggested questions
      </p>
      <SuggestedActions disabled={disabled} onSelect={onSelectSuggestion} />
    </div>
  )
}
