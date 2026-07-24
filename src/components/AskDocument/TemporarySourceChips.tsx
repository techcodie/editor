import { BookOpen, X } from 'lucide-react'
import type { KnowledgeSource } from '../../knowledge/types/source'

interface TemporarySourceChipsProps {
  sources: KnowledgeSource[]
  onRemove: (sourceId: string) => void
}

export function TemporarySourceChips({
  sources,
  onRemove,
}: TemporarySourceChipsProps) {
  if (sources.length === 0) return null

  return (
    <div
      className="mb-2 border-b border-neutral-200 pb-2"
      aria-label="Temporary sources for the next question"
    >
      <p className="mb-1.5 text-[9px] font-semibold uppercase text-neutral-500">
        Current Context
      </p>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((source) => (
          <span
            key={source.id}
            className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-md bg-indigo-50 py-1 pl-1.5 pr-1 text-[10px] font-medium text-indigo-800 ring-1 ring-inset ring-indigo-200"
          >
            <BookOpen size={11} className="shrink-0" aria-hidden />
            <span className="truncate">{source.name}</span>
            <button
              type="button"
              onClick={() => onRemove(source.id)}
              aria-label={`Remove ${source.name} from the next question`}
              title="Remove temporary source"
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-indigo-500 transition-colors hover:bg-indigo-100 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
            >
              <X size={11} strokeWidth={2.2} aria-hidden />
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}
