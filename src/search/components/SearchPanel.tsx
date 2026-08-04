import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { BookmarkPlus, Bot, Clock3, Network, Search, Star, Trash2 } from 'lucide-react'
import type { ComplianceFinding } from '../../compliance/types/compliance'
import type { ContractAnalysis } from '../../contract/types/contract'
import type { WritingAnalysis } from '../../writing/types/writing'
import type { KnowledgeSource, PreparedKnowledgeSource } from '../../knowledge/types/source'
import type { EditorApi } from '../../lib/editor-api'
import type { InternalDocumentEditorEvents } from '../../sdk/events'
import type { Workflow } from '../../workflow/types/workflow'
import type { RedactionRecord } from '../../redaction/types/redaction'
import { PanelShell } from '../../components/ui/PanelShell'
import { Input } from '../../components/ui/Input'
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
  writingAnalysis?: WritingAnalysis | null
}

export function SearchPanel({
  isOpen,
  api,
  namespace,
  knowledgeSources,
  workflow,
  complianceFindings,
  aiEnabled,
  events,
  onClose,
  onOpenDocument,
  onAddKnowledgeSource,
  onAskAI,
  redactions,
  contractAnalysis,
  writingAnalysis,
}: SearchPanelProps) {
  const [view, setView] = useState<SearchView>('results')
  const [relatedSourceId, setRelatedSourceId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const search = useSearch({ api, active: isOpen, namespace, knowledgeSources, workflow, complianceFindings, events, redactions, contractAnalysis, writingAnalysis })
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
    <PanelShell
      isOpen={isOpen}
      onClose={onClose}
      onEscape={() => (relatedSourceId ? setRelatedSourceId(null) : onClose())}
      initialFocusSelector="#semantic-search-input"
      title="Semantic Search"
      subtitle="Hybrid document retrieval and knowledge graph"
      icon={Search}
      iconTone="accent"
      labelledById="semantic-search-title"
      panelId="semantic-search-panel"
      widthClassName="sm:max-w-[31rem] lg:w-[30rem]"
      footer={<EmbeddingStatus progress={search.progress} />}
    >
      <div className="shrink-0 border-b border-neutral-200 px-4 pb-3 pt-3">
        <div className="relative">
          <Input
            id="semantic-search-input"
            icon={Search}
            type="search"
            value={search.query}
            onChange={(event) => search.setQuery(event.target.value)}
            placeholder="Search documents, clauses, entities..."
            aria-label="Search documents"
            inputClassName="pr-9"
          />
          <button
            type="button"
            onClick={() => search.saveSearch()}
            disabled={!search.query.trim()}
            aria-label="Save current search"
            className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-200 hover:text-neutral-900 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
          >
            <BookmarkPlus size={14} aria-hidden />
          </button>
        </div>
      </div>

      {notice && (
        <p role="status" className="shrink-0 border-b border-[var(--document-editor-info-surface)] bg-[var(--document-editor-info-surface)] px-4 py-2 text-[10px] text-[var(--document-editor-info)]">
          {notice}
        </p>
      )}

      <SearchFilters mode={search.mode} filters={search.filters} onModeChange={changeMode} onFiltersChange={search.setFilters} />

      <div className="flex shrink-0 items-center border-b border-neutral-200 px-3" role="tablist" aria-label="Search views">
        <ViewTab active={view === 'results'} label="Results" icon={<Search size={12} aria-hidden />} onClick={() => setView('results')} />
        <ViewTab active={view === 'graph'} label="Graph" icon={<Network size={12} aria-hidden />} onClick={() => setView('graph')} />
        <ViewTab active={view === 'searches'} label="Saved" icon={<Star size={12} aria-hidden />} onClick={() => setView('searches')} />
        {aiEnabled && view === 'results' && visibleResults.length > 0 && (
          <button
            type="button"
            onClick={askSelectedResults}
            className="ml-auto flex h-7 items-center gap-1 rounded-md px-2 text-[9px] font-semibold text-[var(--document-editor-info)] hover:bg-[var(--document-editor-info-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
          >
            <Bot size={12} aria-hidden />
            Summarize
          </button>
        )}
      </div>

      <SearchSummary response={search.response} graph={search.graph} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {search.error && (
          <p role="alert" className="border-b border-[var(--document-editor-danger-surface)] bg-[var(--document-editor-danger-surface)] px-4 py-2.5 text-[10px] text-[var(--document-editor-danger)]">
            {search.error}
          </p>
        )}
        {view === 'graph' ? (
          <Suspense fallback={<div className="px-8 py-14 text-center text-xs text-neutral-500" role="status">Preparing knowledge graph...</div>}>
            <KnowledgeGraphView
              graph={search.graph}
              onSelectDocument={(documentId) => {
                const document = search.documents.find((item) => item.id === documentId)
                if (document) onOpenDocument(document)
              }}
            />
          </Suspense>
        ) : view === 'searches' ? (
          <SavedSearches
            recent={search.recentSearches}
            saved={search.savedSearches}
            onApply={search.applySavedSearch}
            onApplyRecent={(item) => {
              search.setQuery(item.query)
              search.setMode(item.mode)
              setView('results')
            }}
            onRemove={search.removeSavedSearch}
          />
        ) : relatedSource ? (
          <RelatedDocuments
            source={relatedSource}
            results={visibleResults}
            onBack={() => {
              setRelatedSourceId(null)
              void search.executeSearch(search.query, search.mode, search.filters, undefined, false)
            }}
            onOpen={(documentId) => {
              const document = search.documents.find((item) => item.id === documentId)
              if (document) onOpenDocument(document)
            }}
          />
        ) : (
          <SearchResults
            results={visibleResults}
            documents={search.documents}
            pinnedDocumentIds={search.pinnedDocumentIds}
            onOpen={onOpenDocument}
            onAskAI={(document) => onAskAI([document], search.query)}
            onAddSource={addSource}
            onRelated={findRelated}
            onTogglePinned={search.togglePinned}
          />
        )}
      </div>
    </PanelShell>
  )
}

function ViewTab({ active, label, icon, onClick }: { active: boolean; label: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex h-9 items-center gap-1.5 border-b-2 px-2.5 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--document-editor-focus-ring)] ${active ? 'border-[var(--document-editor-info)] text-[var(--document-editor-info)]' : 'border-transparent text-neutral-400 hover:text-neutral-800'}`}
    >
      {icon}
      {label}
    </button>
  )
}

function SavedSearches({
  recent,
  saved,
  onApply,
  onApplyRecent,
  onRemove,
}: {
  recent: Array<{ query: string; mode: SearchMode; searchedAt: number }>
  saved: SavedSearch[]
  onApply: (saved: SavedSearch) => void
  onApplyRecent: (recent: { query: string; mode: SearchMode }) => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="space-y-5 p-4">
      <section>
        <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-neutral-500">
          <Star size={12} aria-hidden />
          Saved searches
        </div>
        {saved.length ? (
          <div className="space-y-1.5">
            {saved.map((item) => (
              <div key={item.id} className="flex items-center rounded-md border border-neutral-200 bg-white">
                <button
                  type="button"
                  onClick={() => onApply(item)}
                  className="min-w-0 flex-1 px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--document-editor-focus-ring)]"
                >
                  <span className="block truncate text-[11px] font-semibold text-neutral-900">{item.name}</span>
                  <span className="block truncate text-[9px] capitalize text-neutral-400">{item.mode} · {item.query}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  aria-label={`Delete saved search ${item.name}`}
                  className="mr-2 flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-[var(--document-editor-danger-surface)] hover:text-[var(--document-editor-danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-danger)]"
                >
                  <Trash2 size={12} aria-hidden />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-neutral-200 px-4 py-5 text-center text-[10px] text-neutral-400">Saved searches appear here.</p>
        )}
      </section>
      <section>
        <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-neutral-500">
          <Clock3 size={12} aria-hidden />
          Recent searches
        </div>
        <div className="space-y-1">
          {recent.map((item) => (
            <button
              key={`${item.mode}:${item.query}`}
              type="button"
              onClick={() => onApplyRecent(item)}
              className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-[10px] text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
            >
              <span className="truncate">{item.query}</span>
              <span className="shrink-0 capitalize text-[9px] text-neutral-400">{item.mode}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
