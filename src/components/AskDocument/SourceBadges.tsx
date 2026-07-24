import { BookOpen, FileText } from 'lucide-react'
import type { AskDocumentSourceMetadata } from '../../../shared/ask-document'

interface SourceBadgesProps {
  sources: AskDocumentSourceMetadata[]
  previewableSourceIds: ReadonlySet<string>
  onOpenSource: (sourceId: string) => void
}

export function SourceBadges({
  sources,
  previewableSourceIds,
  onOpenSource,
}: SourceBadgesProps) {
  return (
    <div
      className="mb-1.5 rounded-md border border-neutral-200 bg-neutral-100/70 px-2.5 py-2 text-left"
      aria-label="Sources for this response"
    >
      <p className="flex items-center gap-1 text-[9px] font-semibold uppercase text-neutral-500">
        <BookOpen size={10} strokeWidth={2} aria-hidden />
        Sources
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {sources.map((source) => {
          const className =
            'inline-flex min-w-0 max-w-full items-center gap-1 rounded-md bg-white px-1.5 py-1 text-[9px] font-medium text-neutral-600 shadow-sm ring-1 ring-inset ring-neutral-200'
          const content = (
            <>
              <FileText size={10} strokeWidth={2} className="shrink-0 text-indigo-500" aria-hidden />
              <span className="truncate">{source.name}</span>
            </>
          )

          return previewableSourceIds.has(source.id) ? (
            <button
              key={source.id}
              type="button"
              onClick={() => onOpenSource(source.id)}
              aria-label={`Open ${source.name} preview`}
              className={`${className} transition-colors hover:bg-indigo-50 hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40`}
            >
              {content}
            </button>
          ) : (
            <span key={source.id} className={className}>
              {content}
            </span>
          )
        })}
      </div>
    </div>
  )
}
