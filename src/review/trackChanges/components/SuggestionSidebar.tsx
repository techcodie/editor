import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  CheckCircle2,
  FilePenLine,
  ListFilter,
  Search,
  UserRound,
  XCircle,
} from 'lucide-react'
import { cn } from '../../../lib/cn'
import { PanelShell } from '../../../components/ui/PanelShell'
import { ChangeNavigator } from './ChangeNavigator'
import { SuggestionCard } from './SuggestionCard'
import { matchesTrackChangeSearch } from '../services/trackChangeRenderer'
import type {
  TrackChange,
  TrackChangeFilter,
  TrackChangeSort,
} from '../types/trackChange'

interface SuggestionSidebarProps {
  isOpen: boolean
  changes: readonly TrackChange[]
  selectedChangeId: string | null
  currentAuthorId: string
  onClose: () => void
  onSelectChange: (changeId: string | null) => void
  onAccept: (changeId: string) => boolean
  onReject: (changeId: string) => boolean
  onAcceptAll: () => number
  onRejectAll: () => number
  onJump: (changeId: string) => boolean
}
const FILTERS: readonly {
  id: TrackChangeFilter
  label: string
  icon: typeof FilePenLine
}[] = [
  { id: 'all', label: 'All', icon: ListFilter },
  { id: 'pending', label: 'Pending', icon: FilePenLine },
  { id: 'accepted', label: 'Accepted', icon: CheckCircle2 },
  { id: 'rejected', label: 'Rejected', icon: XCircle },
  { id: 'mine', label: 'Mine', icon: UserRound },
]

export function SuggestionSidebar({
  isOpen,
  changes,
  selectedChangeId,
  currentAuthorId,
  onClose,
  onSelectChange,
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
  onJump,
}: SuggestionSidebarProps) {
  const [filter, setFilter] = useState<TrackChangeFilter>('pending')
  const [sort, setSort] = useState<TrackChangeSort>('newest')
  const [query, setQuery] = useState('')

  const visibleChanges = useMemo(() => {
    const filtered = changes.filter((change) => {
      if (filter === 'pending' && change.status !== 'pending') return false
      if (filter === 'accepted' && change.status !== 'accepted') return false
      if (filter === 'rejected' && change.status !== 'rejected') return false
      if (filter === 'mine' && change.author.id !== currentAuthorId) return false
      return matchesTrackChangeSearch(change, query)
    })
    return [...filtered].sort((left, right) =>
      sort === 'newest'
        ? right.updatedAt - left.updatedAt
        : left.updatedAt - right.updatedAt,
    )
  }, [changes, currentAuthorId, filter, query, sort])

  const currentIndex = selectedChangeId
    ? visibleChanges.findIndex((change) => change.id === selectedChangeId)
    : -1
  const pendingCount = changes.filter((change) => change.status === 'pending').length
  const counts: Record<TrackChangeFilter, number> = {
    all: changes.length,
    pending: pendingCount,
    accepted: changes.filter((change) => change.status === 'accepted').length,
    rejected: changes.filter((change) => change.status === 'rejected').length,
    mine: changes.filter((change) => change.author.id === currentAuthorId).length,
  }

  const selectAndJump = useCallback(
    (change: TrackChange) => {
      onSelectChange(change.id)
      if (change.status === 'pending') onJump(change.id)
    },
    [onJump, onSelectChange],
  )

  const navigateTo = (index: number) => {
    const change = visibleChanges[index]
    if (change) selectAndJump(change)
  }

  useEffect(() => {
    if (!selectedChangeId) return
    document.getElementById(`suggestion-${selectedChangeId}`)?.scrollIntoView({
      block: 'nearest',
    })
  }, [selectedChangeId])

  return (
    <PanelShell
      isOpen={isOpen}
      onClose={onClose}
      initialFocusSelector="#suggestion-search"
      title="Suggestions"
      subtitle={`${pendingCount} pending ${pendingCount === 1 ? 'change' : 'changes'}`}
      icon={FilePenLine}
      iconTone="accent"
      labelledById="suggestion-sidebar-title"
      panelId="suggestion-sidebar"
      className="review-sidebar"
      widthClassName="sm:max-w-[26rem] lg:w-[25rem]"
      headerActions={
        <ChangeNavigator
          currentIndex={currentIndex}
          total={visibleChanges.length}
          onPrevious={() => navigateTo(currentIndex - 1)}
          onNext={() => navigateTo(currentIndex + 1)}
        />
      }
    >
      <div className="border-b border-neutral-200 px-3 py-3">
        <label htmlFor="suggestion-search" className="sr-only">
          Search suggestions
        </label>
        <div className="relative">
          <Search size={15} strokeWidth={1.9} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden />
          <input
            id="suggestion-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search suggestions"
            className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-3 text-xs text-neutral-900 outline-none transition-[background-color,border-color,box-shadow] placeholder:text-neutral-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
          />
        </div>
        <nav aria-label="Suggestion sections" className="mt-2 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              aria-label={label}
              aria-pressed={filter === id}
              className={cn(
                'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35',
                filter === id
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-950',
              )}
            >
              <Icon size={13} strokeWidth={1.9} aria-hidden />
              {label}
              <span aria-hidden className={filter === id ? 'text-neutral-300' : 'text-neutral-400'}>
                {counts[id]}
              </span>
            </button>
          ))}
        </nav>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onRejectAll}
              disabled={pendingCount === 0}
              className="h-7 rounded-md px-2 text-[10px] font-semibold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/35 disabled:pointer-events-none disabled:opacity-35"
            >
              Reject All
            </button>
            <button
              type="button"
              onClick={onAcceptAll}
              disabled={pendingCount === 0}
              className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[10px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35 disabled:pointer-events-none disabled:opacity-35"
            >
              <Check size={12} aria-hidden />
              Accept All
            </button>
          </div>
          <div className="flex rounded-md bg-neutral-100 p-0.5" aria-label="Suggestion sort order">
            {(['newest', 'oldest'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSort(value)}
                aria-pressed={sort === value}
                className={cn(
                  'h-6 rounded px-2 text-[10px] font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35',
                  sort === value
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900',
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {visibleChanges.length > 0 ? (
          visibleChanges.map((change) => (
            <SuggestionCard
              key={change.id}
              change={change}
              selected={selectedChangeId === change.id}
              onSelect={onSelectChange}
              onAccept={onAccept}
              onReject={onReject}
              onJump={onJump}
            />
          ))
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center px-8 text-center">
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-400">
              <FilePenLine size={18} strokeWidth={1.8} aria-hidden />
            </span>
            <p className="text-sm font-semibold text-neutral-900">
              {query ? 'No matching suggestions' : 'No suggestions here'}
            </p>
            <p className="mt-1 max-w-56 text-xs leading-5 text-neutral-500">
              {query
                ? 'Try another author, type, status, or date.'
                : 'Edits made in Suggestion Mode will appear here.'}
            </p>
          </div>
        )}
      </div>
    </PanelShell>
  )
}
