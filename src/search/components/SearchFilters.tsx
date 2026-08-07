import { SlidersHorizontal } from 'lucide-react'
import type { SearchDocumentKind, SearchFiltersState, SearchMode } from '../types/search'

const MODES: Array<{ value: SearchMode; label: string }> = [
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'semantic', label: 'Semantic' },
  { value: 'keyword', label: 'Keyword' },
  { value: 'recent', label: 'Recent' },
  { value: 'knowledge-sources', label: 'Sources' },
]

const KINDS: Array<{ value: SearchDocumentKind; label: string }> = [
  { value: 'current-document', label: 'Current' },
  { value: 'knowledge-source', label: 'Sources' },
  { value: 'version', label: 'Versions' },
  { value: 'compliance-finding', label: 'Findings' },
  { value: 'contract-clause', label: 'Clauses' },
  { value: 'contract-obligation', label: 'Duties' },
  { value: 'contract-date', label: 'Dates' },
  { value: 'writing-suggestion', label: 'Writing' },
]

interface SearchFiltersProps {
  mode: SearchMode
  filters: Partial<SearchFiltersState>
  onModeChange: (mode: SearchMode) => void
  onFiltersChange: (filters: Partial<SearchFiltersState>) => void
}

export function SearchFilters({ mode, filters, onModeChange, onFiltersChange }: SearchFiltersProps) {
  const toggleKind = (kind: SearchDocumentKind) => {
    const current = filters.kinds ?? []
    const kinds = current.includes(kind)
      ? current.filter((item) => item !== kind)
      : [...current, kind]
    onFiltersChange({ ...filters, kinds })
  }
  return (
    <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="search-mode">Search mode</label>
        <select
          id="search-mode"
          value={mode === 'related' ? 'hybrid' : mode}
          onChange={(event) => onModeChange(event.target.value as SearchMode)}
          className="h-8 min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2.5 text-[11px] font-medium text-neutral-800 outline-none transition-colors hover:border-neutral-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
        >
          {MODES.map((item) => <option key={item.value} value={item.value}>{item.label} search</option>)}
        </select>
        <span className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-400" title="Result filters">
          <SlidersHorizontal size={14} aria-hidden />
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Document type filters">
        {KINDS.map((kind) => {
          const active = filters.kinds?.includes(kind.value) ?? false
          return (
            <button
              key={kind.value}
              type="button"
              aria-pressed={active}
              onClick={() => toggleKind(kind.value)}
              className={`h-6 rounded-md border px-2 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] ${active ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'}`}
            >
              {kind.label}
            </button>
          )
        })}
        {(filters.kinds?.length ?? 0) > 0 && (
          <button type="button" onClick={() => onFiltersChange({ ...filters, kinds: [] })} className="h-6 px-1.5 text-[10px] font-medium text-neutral-400 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]">Clear</button>
        )}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="sr-only" htmlFor="search-workflow-status">Workflow status</label>
        <select
          id="search-workflow-status"
          value={filters.workflowStatuses?.[0] ?? ''}
          onChange={(event) => onFiltersChange({
            ...filters,
            workflowStatuses: event.target.value ? [event.target.value] : [],
          })}
          className="h-7 rounded-md border border-neutral-200 bg-white px-2 text-[10px] text-neutral-600 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
        >
          <option value="">Any workflow state</option>
          <option value="draft">Draft</option>
          <option value="in-review">In review</option>
          <option value="changes-requested">Changes requested</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="archived">Archived</option>
        </select>
        <label className="sr-only" htmlFor="search-updated-after">Last updated</label>
        <select
          id="search-updated-after"
          value={filters.updatedAfter ? String(Math.round((Date.now() - filters.updatedAfter) / 86_400_000)) : ''}
          onChange={(event) => {
            const days = Number(event.target.value)
            onFiltersChange({
              ...filters,
              updatedAfter: days ? Date.now() - days * 86_400_000 : undefined,
            })
          }}
          className="h-7 rounded-md border border-neutral-200 bg-white px-2 text-[10px] text-neutral-600 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
        >
          <option value="">Any time</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>
    </div>
  )
}
