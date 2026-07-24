import { ExternalLink, FileText } from 'lucide-react'
import type { AskDocumentSourceMetadata } from '../../../shared/ask-document'
import { getKnowledgeSourceLabel } from '../../knowledge/types/source'

interface EvidenceListProps {
  sources: AskDocumentSourceMetadata[]
  previewableSourceIds: ReadonlySet<string>
  onOpenSource: (sourceId: string) => void
}

export function EvidenceList({
  sources,
  previewableSourceIds,
  onOpenSource,
}: EvidenceListProps) {
  return (
    <section className="mt-2 text-left" aria-label="Evidence for this response">
      <p className="mb-1.5 text-[9px] font-semibold uppercase text-neutral-500">
        Evidence
      </p>
      <div className="space-y-1.5">
        {sources.map((source) => {
          const canPreview = previewableSourceIds.has(source.id)

          return (
            <div
              key={source.id}
              className="rounded-md border border-neutral-200 bg-white px-2.5 py-2 shadow-[0_1px_2px_rgba(20,20,20,0.03)]"
            >
              <div className="flex min-w-0 items-start gap-2">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-neutral-100 text-neutral-600">
                  <FileText size={12} strokeWidth={1.9} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-semibold text-neutral-800">
                    {source.name}
                  </p>
                  <p className="mt-0.5 text-[9px] leading-4 text-neutral-500">
                    {getKnowledgeSourceLabel(source.type)}
                    {source.pageCount ? ` · ${source.pageCount} pages` : ''}
                    {' · Used to answer this response'}
                  </p>
                </div>
              </div>
              {canPreview && (
                <button
                  type="button"
                  onClick={() => onOpenSource(source.id)}
                  aria-label={`Open ${source.name} preview`}
                  className="mt-2 inline-flex h-6 items-center gap-1 rounded px-1.5 text-[9px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                >
                  <ExternalLink size={10} strokeWidth={2} aria-hidden />
                  Open Preview
                </button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
