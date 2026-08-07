import { ArrowLeft, Link2 } from 'lucide-react'
import type { IndexedDocument, SearchResult } from '../types/search'

export function RelatedDocuments({ source, results, onBack, onOpen }: { source: IndexedDocument; results: SearchResult[]; onBack: () => void; onOpen: (documentId: string) => void }) {
  return (
    <section aria-labelledby="related-documents-title">
      <div className="flex items-center gap-2 border-b border-neutral-200 bg-indigo-50/50 px-4 py-2.5 dark:border-neutral-800 dark:bg-indigo-950/30">
        <button type="button" onClick={onBack} aria-label="Back to search results" className="flex h-7 w-7 items-center justify-center rounded-md text-indigo-700 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"><ArrowLeft size={14} aria-hidden /></button>
        <Link2 size={14} className="text-indigo-600" aria-hidden />
        <div className="min-w-0"><h3 id="related-documents-title" className="truncate text-[11px] font-semibold text-indigo-950">Related to {source.title}</h3><p className="text-[9px] text-indigo-600">Shared entities, topics, and references</p></div>
      </div>
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {results.map((result) => <button key={result.id} type="button" onClick={() => onOpen(result.documentId)} className="block w-full px-4 py-3 text-left transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--document-editor-focus-ring)] dark:hover:bg-neutral-900"><span className="flex items-center justify-between gap-3"><span className="truncate text-xs font-semibold text-neutral-900 dark:text-neutral-100">{result.title}</span><span className="text-[9px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">{Math.round(result.score * 100)}%</span></span><span className="mt-1 line-clamp-2 text-[10px] leading-4 text-neutral-500 dark:text-neutral-400">{result.snippet}</span></button>)}
      </div>
    </section>
  )
}
