import { Check, MessageSquareText, X } from 'lucide-react'
import type { WritingSuggestion } from '../../writing/types/suggestion'

interface GrammarSuggestionCardProps {
  suggestion: WritingSuggestion
  onApply: (suggestion: WritingSuggestion) => void
  onComment: (suggestion: WritingSuggestion) => void
  onDismiss: (id: string) => void
}

export function GrammarSuggestionCard({ suggestion, onApply, onComment, onDismiss }: GrammarSuggestionCardProps) {
  return (
    <article className="rounded-md border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1"><h3 className="text-xs font-semibold text-neutral-900">{suggestion.title}</h3><p className="mt-0.5 text-[10px] capitalize text-neutral-500">{suggestion.category.replace('-', ' ')} · {Math.round(suggestion.confidence * 100)}%</p></div>
        <button type="button" onClick={() => onDismiss(suggestion.id)} aria-label={`Dismiss ${suggestion.title}`} title="Dismiss" className="flex h-7 w-7 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><X size={13} aria-hidden /></button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]"><div className="rounded bg-red-50 px-2 py-1.5 text-red-800 line-through">{suggestion.originalText}</div><div className="rounded bg-emerald-50 px-2 py-1.5 text-emerald-800">{suggestion.suggestedText}</div></div>
      <p className="mt-2 text-[11px] leading-4 text-neutral-600">{suggestion.reason}</p>
      <div className="mt-2 flex gap-1.5">
        <button type="button" onClick={() => onApply(suggestion)} className="inline-flex h-8 items-center gap-1 rounded-md bg-neutral-900 px-2.5 text-[10px] font-semibold text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><Check size={13} aria-hidden />Apply</button>
        <button type="button" onClick={() => onComment(suggestion)} className="inline-flex h-8 items-center gap-1 rounded-md border border-neutral-200 px-2.5 text-[10px] font-semibold text-neutral-600 hover:border-neutral-300 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><MessageSquareText size={13} aria-hidden />Comment</button>
      </div>
    </article>
  )
}
