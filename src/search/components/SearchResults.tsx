import { useMemo, type ReactNode } from 'react'
import { Bot, Clock3, ExternalLink, FileClock, FileText, Link2, Pin, PinOff, Plus, ShieldAlert } from 'lucide-react'
import type { IndexedDocument, SearchResult } from '../types/search'

interface SearchResultsProps {
  results: SearchResult[]
  documents: IndexedDocument[]
  pinnedDocumentIds: string[]
  onOpen: (document: IndexedDocument) => void
  onAskAI: (document: IndexedDocument) => void
  onAddSource: (document: IndexedDocument) => void
  onRelated: (documentId: string) => void
  onTogglePinned: (documentId: string) => void
}

function ResultIcon({ kind }: { kind: SearchResult['metadata']['kind'] }) {
  if (kind === 'version') return <FileClock size={15} aria-hidden />
  if (kind === 'knowledge-source') return <Link2 size={15} aria-hidden />
  if (kind === 'compliance-finding') return <ShieldAlert size={15} aria-hidden />
  return <FileText size={15} aria-hidden />
}

export function SearchResults({ results, documents, pinnedDocumentIds, onOpen, onAskAI, onAddSource, onRelated, onTogglePinned }: SearchResultsProps) {
  const documentsById = useMemo(
    () => new Map(documents.map((document) => [document.id, document])),
    [documents],
  )
  if (results.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-14 text-center">
        <SearchIcon />
        <h3 className="mt-3 text-sm font-semibold text-neutral-900">No matching documents</h3>
        <p className="mt-1 max-w-[18rem] text-xs leading-5 text-neutral-500">Try a broader phrase, switch search mode, or clear a document filter.</p>
      </div>
    )
  }
  return (
    <div className="divide-y divide-neutral-100" role="list" aria-label="Search results">
      {results.map((result) => {
        const document = documentsById.get(result.documentId)
        if (!document) return null
        const pinned = pinnedDocumentIds.includes(result.documentId)
        return (
          <article key={result.id} role="listitem" className="group px-4 py-3.5 [content-visibility:auto] [contain-intrinsic-size:180px] transition-colors hover:bg-neutral-50/80 dark:hover:bg-neutral-900/80">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"><ResultIcon kind={result.metadata.kind} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <button type="button" onClick={() => onOpen(document)} className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35">
                    <h3 className="truncate text-xs font-semibold text-neutral-950 dark:text-neutral-100">{result.title}</h3>
                  </button>
                  <span className="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-emerald-700">{Math.round(result.score * 100)}%</span>
                </div>
                <p className="mt-1 line-clamp-3 text-[11px] leading-[1.55] text-neutral-600 dark:text-neutral-400">{result.snippet || 'No preview text is available.'}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {result.matchedTopics.slice(0, 3).map((topic) => <span key={topic} className="rounded bg-neutral-100 px-1.5 py-0.5 text-[9px] text-neutral-600">{topic}</span>)}
                  <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[9px] capitalize text-neutral-500">{result.metadata.kind.replaceAll('-', ' ')}</span>
                  {result.metadata.workflowStatus && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] capitalize text-blue-700">{result.metadata.workflowStatus.replaceAll('-', ' ')}</span>}
                </div>
                <div className="mt-2.5 flex items-center gap-1">
                  <ActionButton label="Open result" onClick={() => onOpen(document)} icon={<ExternalLink size={12} aria-hidden />} />
                  <ActionButton label="Ask AI" onClick={() => onAskAI(document)} icon={<Bot size={12} aria-hidden />} />
                  {document.metadata.kind === 'version' && <ActionButton label="Add as source" onClick={() => onAddSource(document)} icon={<Plus size={12} aria-hidden />} />}
                  {result.relatedDocumentIds.length > 0 && <ActionButton label="Related documents" onClick={() => onRelated(document.id)} icon={<Link2 size={12} aria-hidden />} />}
                  <button type="button" onClick={() => onTogglePinned(document.id)} aria-label={pinned ? 'Unpin result' : 'Pin result'} title={pinned ? 'Unpin' : 'Pin'} className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35">{pinned ? <PinOff size={12} aria-hidden /> : <Pin size={12} aria-hidden />}</button>
                </div>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function ActionButton({ label, icon, onClick }: { label: string; icon: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-label={label} title={label} className="flex h-7 items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 text-[9px] font-medium text-neutral-600 shadow-sm transition-colors hover:border-neutral-300 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:text-white">{icon}<span className="hidden min-[420px]:inline">{label}</span></button>
}

function SearchIcon() {
  return <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-300"><Clock3 size={18} aria-hidden /></span>
}
