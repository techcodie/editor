import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { ArrowLeftRight, FileDiff, ListFilter } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useComparison } from '../hooks/useComparison'
import type {
  ComparisonDocument,
  ComparisonSourceKind,
  ComparisonViewMode,
} from '../types/comparison'
import { ComparisonNavigator } from './ComparisonNavigator'
import { ComparisonSidebar } from './ComparisonSidebar'
import { ComparisonSummary } from './ComparisonSummary'
import { ComparisonToolbar } from './ComparisonToolbar'
import { ComparisonViewer } from './ComparisonViewer'

interface ComparisonWorkspaceProps {
  initialDocument: string
  initialLeftDocument?: ComparisonDocument
  initialRightDocument?: ComparisonDocument
  onClose: () => void
}

interface DocumentInputProps {
  side: 'Original' | 'Modified'
  document: ComparisonDocument
  onChange: (document: ComparisonDocument) => void
}

function DocumentInput({ side, document, onChange }: DocumentInputProps) {
  return (
    <section className="flex min-h-0 flex-col border-neutral-200 first:border-b md:first:border-b-0 md:first:border-r">
      <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-3">
        <span className="text-xs font-semibold text-neutral-900">{side}</span>
        <select
          value={document.kind}
          onChange={(event) => onChange({ ...document, kind: event.target.value as ComparisonSourceKind })}
          aria-label={`${side} source type`}
          className="ml-auto h-7 rounded-md border border-neutral-200 bg-white px-2 text-[10px] font-medium text-neutral-600 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
        >
          <option value="document">Document</option>
          <option value="version">Version</option>
        </select>
      </div>
      <label className="border-b border-neutral-100 px-4 py-2.5">
        <span className="sr-only">{side} name</span>
        <input
          value={document.name}
          onChange={(event) => onChange({ ...document, name: event.target.value })}
          placeholder={`${side} name`}
          className="h-8 w-full rounded-md border border-transparent px-2 text-xs font-medium text-neutral-800 outline-none transition-colors hover:border-neutral-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
        />
      </label>
      <label className="min-h-56 flex-1">
        <span className="sr-only">{side} content</span>
        <textarea
          value={document.content}
          onChange={(event) => onChange({ ...document, content: event.target.value })}
          placeholder={side === 'Original' ? 'Original document text' : 'Modified document text'}
          spellCheck
          className="h-full min-h-56 w-full resize-none bg-white px-5 py-5 font-serif text-[15px] leading-7 text-neutral-800 outline-none placeholder:font-sans placeholder:text-sm placeholder:text-neutral-300 focus:bg-indigo-50/15 sm:px-7 sm:py-7"
        />
      </label>
    </section>
  )
}

export function ComparisonWorkspace({
  initialDocument,
  initialLeftDocument,
  initialRightDocument,
  onClose,
}: ComparisonWorkspaceProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const [viewMode, setViewMode] = useState<ComparisonViewMode>('split')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const {
    leftDocument,
    rightDocument,
    comparison,
    filter,
    sort,
    query,
    selectedChangeId,
    visibleChanges,
    setLeftDocument,
    setRightDocument,
    runComparison,
    resetComparison,
    decide,
    decideAll,
    setFilter,
    setSort,
    setQuery,
    setSelectedChangeId,
  } = useComparison(initialDocument, initialLeftDocument, initialRightDocument)

  const selectAndJump = useCallback((changeId: string) => {
    setSelectedChangeId(changeId)
    const preferredPane = viewMode === 'unified' ? 'unified' : 'right'
    const target = document.querySelector<HTMLElement>(
      `[data-comparison-pane="${preferredPane}"][data-comparison-change="${changeId}"]`,
    ) ?? document.querySelector<HTMLElement>(
      `[data-comparison-pane="left"][data-comparison-change="${changeId}"]`,
    )
    target?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    return Boolean(target)
  }, [setSelectedChangeId, viewMode])

  const navigate = useCallback((direction: -1 | 1) => {
    if (visibleChanges.length === 0) return
    const currentIndex = visibleChanges.findIndex((change) => change.id === selectedChangeId)
    const nextIndex = Math.min(
      visibleChanges.length - 1,
      Math.max(0, currentIndex < 0 ? 0 : currentIndex + direction),
    )
    selectAndJump(visibleChanges[nextIndex].id)
  }, [selectAndJump, selectedChangeId, visibleChanges])

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null
    requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>('[aria-label="Close comparison"]')?.focus()
    })
    return () => previousFocusRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (comparison && event.altKey && event.key === 'ArrowUp') {
        event.preventDefault()
        navigate(-1)
        return
      }
      if (comparison && event.altKey && event.key === 'ArrowDown') {
        event.preventDefault()
        navigate(1)
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [comparison, navigate, onClose])

  const canCompare =
    (leftDocument.content.length > 0 || rightDocument.content.length > 0) &&
    leftDocument.content !== rightDocument.content

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-title"
      className="fixed inset-0 z-[80] flex flex-col overflow-hidden bg-[#f6f6f4] text-neutral-950"
    >
      <ComparisonToolbar
        hasComparison={Boolean(comparison)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onReset={resetComparison}
        onClose={onClose}
      />

      {!comparison ? (
        <main className="flex min-h-0 flex-1 flex-col p-3 sm:p-5">
          <div className="grid min-h-0 flex-1 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-[var(--document-editor-shadow-surface)] md:grid-cols-2">
            <DocumentInput side="Original" document={leftDocument} onChange={setLeftDocument} />
            <DocumentInput side="Modified" document={rightDocument} onChange={setRightDocument} />
          </div>
          <div className="mt-3 flex shrink-0 items-center justify-between gap-3 sm:mt-4">
            <button
              type="button"
              onClick={() => {
                setLeftDocument({ ...rightDocument, id: leftDocument.id })
                setRightDocument({ ...leftDocument, id: rightDocument.id })
              }}
              className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-200/70 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
            >
              <ArrowLeftRight size={15} strokeWidth={1.9} aria-hidden />
              Swap
            </button>
            <button
              type="button"
              onClick={runComparison}
              disabled={!canCompare}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-neutral-900 px-4 text-xs font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] hover:-translate-y-px hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-35"
            >
              <FileDiff size={15} strokeWidth={1.9} aria-hidden />
              Compare
            </button>
          </div>
        </main>
      ) : (
        <main className="flex min-h-0 flex-1 flex-col">
          <ComparisonSummary summary={comparison.summary} statistics={comparison.statistics} />
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-3 sm:px-5">
            <ComparisonNavigator
              changes={visibleChanges}
              selectedChangeId={selectedChangeId}
              onSelect={selectAndJump}
              onPrevious={() => navigate(-1)}
              onNext={() => navigate(1)}
            />
            <button
              type="button"
              onClick={() => setIsSidebarOpen((open) => !open)}
              aria-expanded={isSidebarOpen}
              aria-label={isSidebarOpen ? 'Hide change sidebar' : 'Show change sidebar'}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]',
                isSidebarOpen ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900',
              )}
            >
              <ListFilter size={14} aria-hidden />
              Changes
            </button>
          </div>
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="min-w-0 flex-1">
              <ComparisonViewer
                viewMode={viewMode}
                leftDocument={comparison.leftDocument}
                rightDocument={comparison.rightDocument}
                segments={comparison.segments}
                changes={comparison.changes}
                selectedChangeId={selectedChangeId}
                onSelectChange={selectAndJump}
              />
            </div>
            <ComparisonSidebar
              isOpen={isSidebarOpen}
              changes={comparison.changes}
              visibleChanges={visibleChanges}
              selectedChangeId={selectedChangeId}
              filter={filter}
              sort={sort}
              query={query}
              onFilterChange={setFilter}
              onSortChange={setSort}
              onQueryChange={setQuery}
              onClose={() => setIsSidebarOpen(false)}
              onSelectChange={selectAndJump}
              onDecide={decide}
              onDecideAll={decideAll}
              onJump={selectAndJump}
            />
          </div>
        </main>
      )}
    </div>
  )
}
