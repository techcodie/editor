import { Check, Search, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { SuggestionCard } from '../../review/trackChanges/components/SuggestionCard'
import type {
  TrackChange,
  TrackChangeDecision,
} from '../../review/trackChanges/types/trackChange'
import type {
  ComparisonFilter,
  ComparisonSort,
} from '../types/comparison'

interface ComparisonSidebarProps {
  isOpen: boolean
  changes: TrackChange[]
  visibleChanges: TrackChange[]
  selectedChangeId: string | null
  filter: ComparisonFilter
  sort: ComparisonSort
  query: string
  onFilterChange: (filter: ComparisonFilter) => void
  onSortChange: (sort: ComparisonSort) => void
  onQueryChange: (query: string) => void
  onClose: () => void
  onSelectChange: (changeId: string) => void
  onDecide: (changeId: string, decision: TrackChangeDecision) => boolean
  onDecideAll: (decision: TrackChangeDecision) => void
  onJump: (changeId: string) => boolean
}

const FILTERS: { id: ComparisonFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'insert', label: 'Insertions' },
  { id: 'delete', label: 'Deletions' },
  { id: 'replace', label: 'Replacements' },
  { id: 'format', label: 'Formatting' },
  { id: 'pending', label: 'Pending' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'rejected', label: 'Rejected' },
]

export function ComparisonSidebar({
  isOpen,
  changes,
  visibleChanges,
  selectedChangeId,
  filter,
  sort,
  query,
  onFilterChange,
  onSortChange,
  onQueryChange,
  onClose,
  onSelectChange,
  onDecide,
  onDecideAll,
  onJump,
}: ComparisonSidebarProps) {
  const pendingCount = changes.filter((change) => change.status === 'pending').length
  const counts = new Map<ComparisonFilter, number>([
    ['all', changes.length],
    ['insert', changes.filter((change) => change.type === 'insert').length],
    ['delete', changes.filter((change) => change.type === 'delete').length],
    ['replace', changes.filter((change) => change.type === 'replace').length],
    ['format', changes.filter((change) => change.type === 'format').length],
    ['pending', pendingCount],
    ['accepted', changes.filter((change) => change.status === 'accepted').length],
    ['rejected', changes.filter((change) => change.status === 'rejected').length],
  ])

  return (
    <aside
      aria-label="Comparison changes"
      className={cn(
        'min-h-0 w-full flex-col border-l border-neutral-200 bg-white lg:flex lg:w-[22rem] lg:shrink-0',
        isOpen
          ? 'fixed inset-y-0 right-0 z-30 flex max-w-[23rem] shadow-[var(--document-editor-shadow-overlay)] lg:static lg:max-w-none lg:shadow-none'
          : 'hidden',
      )}
    >
      <div className="shrink-0 border-b border-neutral-200 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-semibold text-neutral-950">Changes</h2>
            <p className="mt-0.5 text-[10px] text-neutral-500">{changes.length} total · {pendingCount} pending</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Hide change sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] lg:hidden"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
        <label className="relative mt-3 block">
          <span className="sr-only">Search changes</span>
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search text, type, status"
            className="h-9 w-full rounded-md border border-neutral-200 bg-neutral-50 pl-8 pr-3 text-xs text-neutral-900 outline-none transition-[background-color,border-color,box-shadow] placeholder:text-neutral-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
          />
        </label>
        <nav aria-label="Change filters" className="mt-2 flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onFilterChange(item.id)}
              aria-pressed={filter === item.id}
              className={cn(
                'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]',
                filter === item.id
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-950',
              )}
            >
              {item.label}
              <span className={filter === item.id ? 'text-neutral-300' : 'text-neutral-400'}>{counts.get(item.id)}</span>
            </button>
          ))}
        </nav>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onDecideAll('reject')}
              disabled={pendingCount === 0}
              className="h-7 rounded-md px-2 text-[10px] font-semibold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/35 disabled:pointer-events-none disabled:opacity-35"
            >
              Reject All
            </button>
            <button
              type="button"
              onClick={() => onDecideAll('accept')}
              disabled={pendingCount === 0}
              className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[10px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35 disabled:pointer-events-none disabled:opacity-35"
            >
              <Check size={12} aria-hidden />
              Accept All
            </button>
          </div>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as ComparisonSort)}
            aria-label="Sort changes"
            className="h-7 rounded-md border border-neutral-200 bg-white px-2 text-[10px] font-medium text-neutral-600 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
          >
            <option value="document">Document order</option>
            <option value="type">Change type</option>
          </select>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {visibleChanges.length > 0 ? (
          visibleChanges.map((change) => (
            <SuggestionCard
              key={change.id}
              change={change}
              selected={change.id === selectedChangeId}
              onSelect={onSelectChange}
              onAccept={(changeId) => onDecide(changeId, 'accept')}
              onReject={(changeId) => onDecide(changeId, 'reject')}
              onJump={onJump}
            />
          ))
        ) : (
          <div className="flex min-h-44 flex-col items-center justify-center px-8 text-center">
            <Search size={20} strokeWidth={1.6} className="text-neutral-300" aria-hidden />
            <p className="mt-2 text-xs font-medium text-neutral-700">No matching changes</p>
            <button
              type="button"
              onClick={() => {
                onFilterChange('all')
                onQueryChange('')
              }}
              className="mt-2 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
