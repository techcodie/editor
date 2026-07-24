import { CheckCircle2, FileText, Trash2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import {
  formatKnowledgeSourceSize,
  getKnowledgeSourceLabel,
  type KnowledgeSource,
} from '../types/source'

interface SourceCardProps {
  source: KnowledgeSource
  onRemove?: (sourceId: string) => void
}

export function SourceCard({ source, onRemove }: SourceCardProps) {
  const isCurrent = source.status === 'current'

  return (
    <article
      className={cn(
        'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-[border-color,background-color,box-shadow] duration-150',
        isCurrent
          ? 'border-emerald-200/80 bg-emerald-50/50'
          : 'border-neutral-200 bg-white shadow-[0_1px_2px_rgba(20,20,20,0.03)] hover:border-neutral-300 hover:shadow-[0_8px_18px_-15px_rgba(20,20,20,0.28)]',
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
          isCurrent ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600',
        )}
        aria-hidden
      >
        <FileText size={15} strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate text-xs font-semibold text-neutral-900">{source.name}</h4>
            <p className="mt-0.5 text-[10px] text-neutral-500">
              {getKnowledgeSourceLabel(source.type)}
              {isCurrent ? ' · Always included' : ` · ${formatKnowledgeSourceSize(source.size)}`}
            </p>
          </div>
          {isCurrent && (
            <CheckCircle2
              size={15}
              strokeWidth={2}
              className="mt-0.5 shrink-0 text-emerald-600"
              aria-label="Included"
            />
          )}
        </div>
        {!isCurrent && (
          <div className="mt-2 flex items-center gap-1">
            <span title="Preview will be available in the next milestone.">
              <button
                type="button"
                disabled
                aria-label={`Preview ${source.name}`}
                className="inline-flex h-7 items-center rounded-md px-2 text-[11px] font-medium text-neutral-400"
              >
                Preview
              </button>
            </span>
            <button
              type="button"
              onClick={() => onRemove?.(source.id)}
              className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
              aria-label={`Remove ${source.name}`}
            >
              <Trash2 size={12} strokeWidth={1.9} aria-hidden />
              Remove
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
