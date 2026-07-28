import { ArrowUpRight, TextSearch } from 'lucide-react'
import type { VocabularySuggestion } from '../types/suggestion'

export function VocabularySuggestions({ suggestions, onJump }: { suggestions: VocabularySuggestion[]; onJump: (suggestion: VocabularySuggestion) => void }) {
  return (
    <section className="border-t border-neutral-200 p-4 dark:border-neutral-800" aria-labelledby="vocabulary-title">
      <div className="flex items-center gap-2"><TextSearch size={13} className="text-neutral-400" aria-hidden /><h3 id="vocabulary-title" className="text-[10px] font-semibold text-neutral-900 dark:text-neutral-100">Vocabulary variety</h3></div>
      {suggestions.length === 0 ? <p className="mt-3 text-[10px] leading-4 text-neutral-500">No frequently repeated general words were found.</p> : <div className="mt-3 space-y-2">{suggestions.map((item) => <button key={item.id} type="button" onClick={() => onJump(item)} className="flex w-full items-center gap-3 rounded-md border border-neutral-200 px-3 py-2.5 text-left transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 dark:border-neutral-800 dark:hover:bg-neutral-900"><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold text-neutral-900 dark:text-neutral-100">{item.word} <span className="font-normal text-neutral-400">×{item.count}</span></p><p className="mt-1 truncate text-[8px] text-neutral-500">Try {item.alternatives.join(', ')}</p></div><ArrowUpRight size={12} className="shrink-0 text-neutral-400" aria-hidden /></button>)}</div>}
    </section>
  )
}
