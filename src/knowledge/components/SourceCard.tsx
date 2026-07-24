import { CircleAlert, Eye, FileText, LoaderCircle, Trash2 } from 'lucide-react'
import { memo } from 'react'
import { cn } from '../../lib/cn'
import {
  formatKnowledgeSourceSize,
  getKnowledgeSourceLabel,
  type KnowledgeSource,
} from '../types/source'

interface SourceCardProps {
  source: KnowledgeSource
  onPreview?: (source: KnowledgeSource) => void
  onRemove?: (sourceId: string) => void
  onActiveChange?: (sourceId: string, isActive: boolean) => void
}

export const SourceCard = memo(function SourceCard({
  source,
  onPreview,
  onRemove,
  onActiveChange,
}: SourceCardProps) {
  const isCurrent = source.status === 'current'
  const isReady = source.parseStatus === 'ready'
  const isParsing = source.parseStatus === 'parsing'
  const hasError = source.parseStatus === 'error'
  const isUsedByAi = isCurrent || (isReady && source.isActive)

  const sourceDetails = (
    <>
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
          isCurrent
            ? 'bg-emerald-100 text-emerald-700'
            : hasError
              ? 'bg-red-50 text-red-600'
              : 'bg-neutral-100 text-neutral-600',
        )}
        aria-hidden
      >
        {isParsing ? (
          <LoaderCircle size={15} strokeWidth={1.9} className="animate-spin" />
        ) : hasError ? (
          <CircleAlert size={15} strokeWidth={1.9} />
        ) : (
          <FileText size={15} strokeWidth={1.9} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate text-xs font-semibold text-neutral-900">{source.name}</h4>
            <p className="mt-0.5 text-[10px] text-neutral-500">
              {getKnowledgeSourceLabel(source.type)}
              {isCurrent
                ? ' · Always included'
                : isParsing
                  ? ' · Preparing preview'
                  : ` · ${formatKnowledgeSourceSize(source.size)}`}
            </p>
          </div>
          {isCurrent && (
            <span
              role="switch"
              aria-checked="true"
              aria-disabled="true"
              aria-label="Current Document is always active"
              title="Current Document is always active"
              className="mt-0.5 inline-flex h-5 w-8 shrink-0 items-center justify-end rounded-full bg-emerald-600 p-0.5"
            >
              <span className="h-4 w-4 rounded-full bg-white shadow-sm" aria-hidden />
            </span>
          )}
        </div>
        {hasError && (
          <p className="mt-1.5 line-clamp-2 text-[10px] leading-4 text-red-600" role="alert">
            {source.errorMessage}
          </p>
        )}
      </div>
    </>
  )

  return (
    <article
      className={cn(
        'rounded-lg border transition-[border-color,background-color,box-shadow] duration-150',
        isCurrent
          ? 'border-emerald-200/80 bg-emerald-50/50 px-3 py-2.5'
          : 'border-neutral-200 bg-white shadow-[0_1px_2px_rgba(20,20,20,0.03)] hover:border-neutral-300 hover:shadow-[0_8px_18px_-15px_rgba(20,20,20,0.28)]',
      )}
    >
      {isCurrent ? (
        <div className="flex items-start gap-2.5">{sourceDetails}</div>
      ) : (
        <>
          <button
            type="button"
            disabled={!isReady}
            onClick={() => onPreview?.(source)}
            className="flex w-full items-start gap-2.5 rounded-t-lg px-3 pb-1 pt-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500/35 disabled:cursor-default"
            aria-label={isReady ? `Open preview for ${source.name}` : undefined}
          >
            {sourceDetails}
          </button>
          <div className="flex items-center gap-1 px-2 pb-2">
            <button
              type="button"
              role="switch"
              aria-checked={isUsedByAi}
              aria-label={`${isUsedByAi ? 'Exclude' : 'Include'} ${source.name} ${
                isUsedByAi ? 'from' : 'in'
              } AI context`}
              title={
                isParsing
                  ? 'Available after parsing'
                  : hasError
                    ? 'Unavailable because parsing failed'
                    : source.isActive
                      ? 'Active in AI context'
                      : 'Inactive in AI context'
              }
              disabled={!isReady}
              onClick={() => onActiveChange?.(source.id, !source.isActive)}
              className="group inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 disabled:cursor-not-allowed disabled:text-neutral-400 disabled:hover:bg-transparent"
            >
              <span
                className={cn(
                  'inline-flex h-4 w-7 items-center rounded-full p-0.5 transition-colors',
                  isUsedByAi ? 'justify-end bg-emerald-600' : 'justify-start bg-neutral-300',
                )}
                aria-hidden
              >
                <span className="h-3 w-3 rounded-full bg-white shadow-sm" />
              </span>
              {isParsing ? 'Preparing' : isUsedByAi ? 'Active' : 'Inactive'}
            </button>
            <button
              type="button"
              disabled={!isReady}
              onClick={() => onPreview?.(source)}
              className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 disabled:text-neutral-400 disabled:hover:bg-transparent"
              aria-label={`Preview ${source.name}`}
            >
              <Eye size={12} strokeWidth={1.9} aria-hidden />
              Preview
            </button>
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
        </>
      )}
    </article>
  )
})
