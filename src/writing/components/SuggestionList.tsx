import { CheckCircle2 } from 'lucide-react'
import type { WritingSuggestion } from '../types/suggestion'
import { SuggestionCard } from './SuggestionCard'

interface SuggestionListProps {
  suggestions: WritingSuggestion[]
  selectedId: string | null
  onSelect: (suggestion: WritingSuggestion) => void
  onJump: (suggestion: WritingSuggestion) => void
  onApply: (suggestion: WritingSuggestion) => void
  onComment: (suggestion: WritingSuggestion) => void
  onDismiss: (suggestion: WritingSuggestion) => void
  onRestore: (suggestion: WritingSuggestion) => void
}

export function SuggestionList(props: SuggestionListProps) {
  if (props.suggestions.length === 0) {
    return <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center"><CheckCircle2 size={24} className="text-emerald-600" aria-hidden /><h3 className="mt-3 text-xs font-semibold text-neutral-900 dark:text-neutral-100">No matching suggestions</h3><p className="mt-1 text-[9px] leading-4 text-neutral-500">This view is clear. Adjust the filters to review other categories.</p></div>
  }
  return <div className="space-y-2 p-3">{props.suggestions.map((suggestion) => <SuggestionCard key={suggestion.id} suggestion={suggestion} selected={suggestion.id === props.selectedId} onSelect={() => props.onSelect(suggestion)} onJump={() => props.onJump(suggestion)} onApply={() => props.onApply(suggestion)} onComment={() => props.onComment(suggestion)} onDismiss={() => props.onDismiss(suggestion)} onRestore={() => props.onRestore(suggestion)} />)}</div>
}
