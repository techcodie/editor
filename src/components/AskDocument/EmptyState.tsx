import { FileQuestion } from 'lucide-react'
import { EmptyState as SharedEmptyState } from '../ui/EmptyState'
import { SuggestedActions } from './SuggestedActions'

interface EmptyStateProps {
  disabled?: boolean
  onSelectSuggestion: (prompt: string) => void
}

export function EmptyState({ disabled, onSelectSuggestion }: EmptyStateProps) {
  return (
    <SharedEmptyState
      icon={FileQuestion}
      title="Ask about your document"
      description="The assistant answers using the current document and your active sources."
      fillParent
      className="px-1"
      iconBadge={
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#fafaf9] bg-[var(--document-editor-success)]" />
      }
    >
      <p className="mb-2.5 mt-7 w-full text-left text-[11px] font-medium text-neutral-500">
        Suggested questions
      </p>
      <SuggestedActions disabled={disabled} onSelect={onSelectSuggestion} />
    </SharedEmptyState>
  )
}
