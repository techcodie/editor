import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BookmarkPlus, Bot, Clock3, Network, Search, Star, Trash2, X } from 'lucide-react'
import type { ComplianceFinding } from '../../compliance/types/compliance'
import type { ContractAnalysis } from '../../contract/types/contract'
import type { KnowledgeSource, PreparedKnowledgeSource } from '../../knowledge/types/source'
import type { EditorApi } from '../../lib/editor-api'
import type { InternalDocumentEditorEvents } from '../../sdk/events'
import type { Workflow } from '../../workflow/types/workflow'
import type { RedactionRecord } from '../../redaction/types/redaction'
import { useSearch } from '../hooks/useSearch'
import type { IndexedDocument, SavedSearch, SearchMode } from '../types/search'
import { EmbeddingStatus } from './EmbeddingStatus'
import { RelatedDocuments } from './RelatedDocuments'
import { SearchFilters } from './SearchFilters'
import { SearchResults } from './SearchResults'
import { SearchSummary } from './SearchSummary'

type SearchView = 'results' | 'graph' | 'searches'

const KnowledgeGraphView = lazy(async () => {
  const module = await import('./KnowledgeGraphView')
  return { default: module.KnowledgeGraphView }
})

interface SearchPanelProps {
  isOpen: boolean
  api: EditorApi | null
  namespace: string
  knowledgeSources: KnowledgeSource[]
  workflow: Workflow | null
  complianceFindings: ComplianceFinding[]
  aiEnabled: boolean
  events: InternalDocumentEditorEvents
  onClose: () => void
  onOpenDocument: (document: IndexedDocument) => void
  onAddKnowledgeSource: (source: PreparedKnowledgeSource) => void
  onAskAI: (documents: IndexedDocument[], query: string) => void
  redactions?: RedactionRecord[]
  contractAnalysis?: ContractAnalysis | null
}

export function SearchPanel({ isOpen, api, namespace, knowledgeSources, workflow, complianceFindings, aiEnabled, events, onClose, onOpenDocument, onAddKnowledgeSource, onAskAI, redactions, contractAnalysis }: SearchPanelProps) {
  const panelRef = useRef<HTMLElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [view, setView] = useState<SearchView>('results')
  const [relatedSourceId, setRelatedSourceId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const search = useSearch({ api, active: isOpen, namespace, knowledgeSources, workflow, complianceFindings, events, redactions, contractAnalysis })
  const visibleResults = useMemo(() => {
    const results = search.response?.results ?? []
    return [...results].toSorted((left, right) => {
      const leftPinned = search.pinnedDocumentIds.includes(left.documentId) ? 1 : 0
      const rightPinned = search.pinnedDocumentIds.includes(right.documentId) ? 1 : 0
      return rightPinned - leftPinned || right.score - left.score
    })
  }, [search.pinnedDocumentIds, search.response?.results])
  const relatedSource = search.documents.find((document) => document.id === relatedSourceId)

  useEffect(() => {
    if (!isOpen) return
    window.requestAnimationFrame(() => inputRef.current?.focus())
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (relatedSourceId) setRelatedSourceId(null)
        else onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )]
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return
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
  }, [isOpen, onClose, relatedSourceId])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(null), 3200)
    return () => window.clearTimeout(timeout)
  }, [notice])

  if (!isOpen) return null

  const addSource = (document: IndexedDocument) => {
    if (document.metadata.kind === 'knowledge-source') {
      setNotice(`${document.title} is already a Knowledge Source.`)
      return
    }
    onAddKnowledgeSource({ name: `${document.title}.txt`, type: 'txt', size: new Blob([document.content]).size, text: document.content })
    setNotice(`${document.title} was added as an active Knowledge Source.`)
  }
  const findRelated = (documentId: string) => {
    setRelatedSourceId(documentId)
    void search.executeSearch('', 'related', {}, documentId, false)
  }
  const changeMode = (mode: SearchMode) => {
    setRelatedSourceId(null)
    search.setMode(mode)
  }
  const askSelectedResults = () => {
    const selected = visibleResults.slice(0, 5).flatMap((result) => {
      const document = search.documents.find((item) => item.id === result.documentId)
      return document ? [document] : []
    })
    if (selected.length) onAskAI(selected, search.query)
  }

  return (
    <>
      <button type="button" aria-label="Close semantic search" onClick={onClose} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] lg:hidden" />
      <aside ref={panelRef} id="semantic-search-panel" role="dialog" aria-modal="true" aria-labelledby="semantic-search-title" className="fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-hidden border-l border-neutral-200 bg-white shadow-[var(--document-editor-shadow-overlay)] [animation:review-sidebar-in_180ms_ease-out] dark:border-neutral-800 dark:bg-neutral-950 sm:max-w-[31rem] lg:sticky lg:top-6 lg:z-30 lg:h-[calc(100vh-3rem)] lg:w-[30rem] lg:rounded-lg lg:border">
        <header className="shrink-0 border-b border-neutral-200 px-4 pb-3 pt-3.5 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-700"><Search size={16} aria-hidden /></span>
            <div className="min-w-0"><h2 id="semantic-search-title" className="truncate text-sm font-semibold text-neutral-950 dark:text-neutral-100">Semantic Search</h2><p className="truncate text-[10px] text-neutral-500 dark:text-neutral-400">Hybrid document retrieval and knowledge graph</p></div>
            <button type="button" onClick={onClose} aria-label="Close semantic search" className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 dark:hover:bg-neutral-800 dark:hover:text-white"><X size={15} aria-hidden /></button>
          </div>
          <div className="relative mt-3">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden />
            <input ref={inputRef} type="search" value={search.query} onChange={(event) => search.setQuery(event.target.value)} placeholder="Search documents, clauses, entities..." aria-label="Search documents" className="h-10 w-full rounded-md border border-neutral-200 bg-neutral-50 pl-9 pr-20 text-xs text-neutral-900 outline-none transition-[border-color,background-color,box-shadow] placeholder:text-neutral-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:bg-neutral-900" />
            <button type="button" onClick={() => search.saveSearch()} disabled={!search.query.trim()} aria-label="Save current search" title="Save search" className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-200 hover:text-neutral-900 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><BookmarkPlus size={14} aria-hidden /></button>
          </div>
        </header>
        {notice && <p role="status" className="shrink-0 border-b border-indigo-100 bg-indigo-50 px-4 py-2 text-[10px] text-indigo-800">{notice}</p>}
        <SearchFilters mode={search.mode} filters={search.filters} onModeChange={changeMode} onFiltersChange={search.setFilters} />
        <div className="flex shrink-0 items-center border-b border-neutral-200 px-3 dark:border-neutral-800" role="tablist" aria-label="Search views">
          <ViewTab active={view === 'results'} label="Results" icon={<Search size={12} aria-hidden />} onClick={() => setView('results')} />
          <ViewTab active={view === 'graph'} label="Graph" icon={<Network size={12} aria-hidden />} onClick={() => setView('graph')} />
          <ViewTab active={view === 'searches'} label="Saved" icon={<Star size={12} aria-hidden />} onClick={() => setView('searches')} />
          {aiEnabled && view === 'results' && visibleResults.length > 0 && <button type="button" onClick={askSelectedResults} className="ml-auto flex h-7 items-center gap-1 rounded-md px-2 text-[9px] font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><Bot size={12} aria-hidden />Summarize</button>}
        </div>
        <SearchSummary response={search.response} graph={search.graph} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          {search.error && <p role="alert" className="border-b border-red-100 bg-red-50 px-4 py-2.5 text-[10px] text-red-700">{search.error}</p>}
          {view === 'graph' ? <Suspense fallback={<div className="px-8 py-14 text-center text-xs text-neutral-500" role="status">Preparing knowledge graph...</div>}><KnowledgeGraphView graph={search.graph} onSelectDocument={(documentId) => { const document = search.documents.find((item) => item.id === documentId); if (document) onOpenDocument(document) }} /></Suspense> : view === 'searches' ? <SavedSearches recent={search.recentSearches} saved={search.savedSearches} onApply={search.applySavedSearch} onApplyRecent={(item) => { search.setQuery(item.query); search.setMode(item.mode); setView('results') }} onRemove={search.removeSavedSearch} /> : relatedSource ? <RelatedDocuments source={relatedSource} results={visibleResults} onBack={() => { setRelatedSourceId(null); void search.executeSearch(search.query, search.mode, search.filters, undefined, false) }} onOpen={(documentId) => { const document = search.documents.find((item) => item.id === documentId); if (document) onOpenDocument(document) }} /> : <SearchResults results={visibleResults} documents={search.documents} pinnedDocumentIds={search.pinnedDocumentIds} onOpen={onOpenDocument} onAskAI={(document) => onAskAI([document], search.query)} onAddSource={addSource} onRelated={findRelated} onTogglePinned={search.togglePinned} />}
        </div>
        <footer className="shrink-0 border-t border-neutral-200 px-4 py-2.5 dark:border-neutral-800"><EmbeddingStatus progress={search.progress} /></footer>
      </aside>
    </>
  )
}

function ViewTab({ active, label, icon, onClick }: { active: boolean; label: string; icon: ReactNode; onClick: () => void }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`flex h-9 items-center gap-1.5 border-b-2 px-2.5 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500/35 ${active ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-neutral-400 hover:text-neutral-800'}`}>{icon}{label}</button>
}

function SavedSearches({ recent, saved, onApply, onApplyRecent, onRemove }: { recent: Array<{ query: string; mode: SearchMode; searchedAt: number }>; saved: SavedSearch[]; onApply: (saved: SavedSearch) => void; onApplyRecent: (recent: { query: string; mode: SearchMode }) => void; onRemove: (id: string) => void }) {
  return <div className="space-y-5 p-4"><section><div className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-neutral-500"><Star size={12} aria-hidden />Saved searches</div>{saved.length ? <div className="space-y-1.5">{saved.map((item) => <div key={item.id} className="flex items-center rounded-md border border-neutral-200 bg-white"><button type="button" onClick={() => onApply(item)} className="min-w-0 flex-1 px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500/35"><span className="block truncate text-[11px] font-semibold text-neutral-900">{item.name}</span><span className="block truncate text-[9px] capitalize text-neutral-400">{item.mode} · {item.query}</span></button><button type="button" onClick={() => onRemove(item.id)} aria-label={`Delete saved search ${item.name}`} className="mr-2 flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/35"><Trash2 size={12} aria-hidden /></button></div>)}</div> : <p className="rounded-md border border-dashed border-neutral-200 px-4 py-5 text-center text-[10px] text-neutral-400">Saved searches appear here.</p>}</section><section><div className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-neutral-500"><Clock3 size={12} aria-hidden />Recent searches</div><div className="space-y-1">{recent.map((item) => <button key={`${item.mode}:${item.query}`} type="button" onClick={() => onApplyRecent(item)} className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-[10px] text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><span className="truncate">{item.query}</span><span className="shrink-0 capitalize text-[9px] text-neutral-400">{item.mode}</span></button>)}</div></section></div>
}
