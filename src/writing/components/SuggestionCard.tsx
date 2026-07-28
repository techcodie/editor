import { Check, CornerUpRight, MessageSquare, RotateCcw, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { WritingSuggestion } from '../types/suggestion'

const SEVERITY_CLASS = {
  error: 'bg-red-500', warning: 'bg-amber-500', info: 'bg-blue-500',
} as const

interface SuggestionCardProps {
  suggestion: WritingSuggestion
  selected: boolean
  onSelect: () => void
  onJump: () => void
  onApply: () => void
  onComment: () => void
  onDismiss: () => void
  onRestore: () => void
}

export function SuggestionCard(props: SuggestionCardProps) {
  const { suggestion, selected, onSelect, onJump, onApply, onComment, onDismiss, onRestore } = props
  const dismissed = suggestion.status === 'dismissed'
  return (
    <article className={cn('rounded-md border bg-white transition-[border-color,box-shadow] [content-visibility:auto] [contain-intrinsic-size:0_160px] dark:bg-neutral-950', selected ? 'border-violet-300 shadow-sm dark:border-violet-800' : 'border-neutral-200 dark:border-neutral-800', dismissed && 'opacity-65')}>
      <button type="button" onClick={onSelect} className="w-full p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500/35">
        <div className="flex items-start gap-2.5">
          <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${SEVERITY_CLASS[suggestion.severity]}`} aria-hidden />
          <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h4 className="text-[10px] font-semibold text-neutral-950 dark:text-neutral-100">{suggestion.title}</h4><span className="text-[8px] tabular-nums text-neutral-400">{Math.round(suggestion.confidence * 100)}%</span></div><p className="mt-1 text-[9px] leading-4 text-neutral-500">{suggestion.reason}</p></div>
        </div>
      </button>
      {selected && <div className="border-t border-neutral-100 px-3 pb-3 pt-2.5 dark:border-neutral-800"><div className="grid grid-cols-2 gap-2 text-[9px]"><div className="min-w-0 rounded bg-red-50 px-2 py-1.5 text-red-800 line-through dark:bg-red-950/30 dark:text-red-300">{suggestion.originalText}</div><div className="min-w-0 rounded bg-emerald-50 px-2 py-1.5 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">{suggestion.suggestedText}</div></div><div className="mt-3 flex flex-wrap items-center gap-1.5"><button type="button" onClick={onJump} className="inline-flex h-7 items-center gap-1 rounded px-2 text-[9px] font-semibold text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 dark:hover:bg-neutral-800"><CornerUpRight size={11} aria-hidden />Jump</button><button type="button" onClick={onComment} className="inline-flex h-7 items-center gap-1 rounded px-2 text-[9px] font-semibold text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 dark:hover:bg-neutral-800"><MessageSquare size={11} aria-hidden />Comment</button>{dismissed ? <button type="button" onClick={onRestore} className="ml-auto inline-flex h-7 items-center gap-1 rounded px-2 text-[9px] font-semibold text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 dark:hover:bg-neutral-800"><RotateCcw size={11} aria-hidden />Restore</button> : <><button type="button" onClick={onDismiss} className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 dark:hover:bg-neutral-800" aria-label="Dismiss suggestion"><X size={12} aria-hidden /></button><button type="button" onClick={onApply} disabled={suggestion.originalText === suggestion.suggestedText} className="inline-flex h-7 items-center gap-1 rounded bg-neutral-900 px-2.5 text-[9px] font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:bg-white dark:text-neutral-950"><Check size={11} aria-hidden />Suggest change</button></>}</div></div>}
    </article>
  )
}
