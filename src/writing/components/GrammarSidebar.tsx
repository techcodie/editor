import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { WritingSuggestion, WritingSuggestionCategory } from '../types/suggestion'
import { SuggestionList } from './SuggestionList'

type CategoryFilter = 'all' | WritingSuggestionCategory
type StatusFilter = 'open' | 'dismissed' | 'all'

interface GrammarSidebarProps {
  suggestions: WritingSuggestion[]
  selectedId: string | null
  onSelect: (suggestion: WritingSuggestion) => void
  onJump: (suggestion: WritingSuggestion) => void
  onApply: (suggestion: WritingSuggestion) => void
  onComment: (suggestion: WritingSuggestion) => void
  onDismiss: (suggestion: WritingSuggestion) => void
  onRestore: (suggestion: WritingSuggestion) => void
}

const CATEGORIES: Array<{ value: CategoryFilter; label: string }> = [
  { value: 'all', label: 'All' }, { value: 'grammar', label: 'Grammar' },
  { value: 'spelling', label: 'Spelling' }, { value: 'wordiness', label: 'Style' },
  { value: 'long-sentence', label: 'Clarity' }, { value: 'formatting', label: 'Format' },
]

export function GrammarSidebar(props: GrammarSidebarProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('open')
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return props.suggestions.filter((item) => {
      if (status !== 'all' && item.status !== status) return false
      if (category !== 'all') {
        if (category === 'wordiness' && !['wordiness', 'passive-voice', 'repetition', 'tense'].includes(item.category)) return false
        else if (category === 'long-sentence' && !['long-sentence', 'capitalization', 'punctuation'].includes(item.category)) return false
        else if (category !== 'wordiness' && category !== 'long-sentence' && item.category !== category) return false
      }
      return !needle || [item.title, item.reason, item.originalText, item.suggestedText, item.category].some((value) => value.toLocaleLowerCase().includes(needle))
    })
  }, [category, props.suggestions, query, status])
  return <div><div className="border-b border-neutral-200 p-3 dark:border-neutral-800"><label className="flex h-9 items-center gap-2 rounded-md border border-neutral-200 bg-white px-2.5 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-500/15 dark:border-neutral-800 dark:bg-neutral-950"><Search size={13} className="text-neutral-400" aria-hidden /><span className="sr-only">Search writing suggestions</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search suggestions" className="min-w-0 flex-1 bg-transparent text-[10px] text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100" /></label><div className="mt-2 flex gap-1 overflow-x-auto [scrollbar-width:none]">{CATEGORIES.map((item) => <button key={item.value} type="button" onClick={() => setCategory(item.value)} aria-pressed={category === item.value} className={`h-7 shrink-0 rounded px-2 text-[8px] font-semibold ${category === item.value ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}>{item.label}</button>)}</div><label className="mt-2 flex items-center justify-between text-[8px] text-neutral-500"><span>{visible.length} results</span><select aria-label="Filter suggestion status" value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} className="rounded border border-neutral-200 bg-white px-2 py-1 text-[8px] text-neutral-700 outline-none focus:ring-2 focus:ring-violet-500/30 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"><option value="open">Unresolved</option><option value="dismissed">Dismissed</option><option value="all">All status</option></select></label></div><SuggestionList {...props} suggestions={visible} /></div>
}
