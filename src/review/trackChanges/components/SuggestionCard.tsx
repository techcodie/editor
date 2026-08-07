import { memo } from 'react'
import {
  Check,
  CheckCircle2,
  FilePenLine,
  LocateFixed,
  X,
  XCircle,
} from 'lucide-react'
import { cn } from '../../../lib/cn'
import {
  formatTrackChangeDate,
  getTrackChangeLabel,
} from '../services/trackChangeRenderer'
import type { TrackChange } from '../types/trackChange'

interface SuggestionCardProps {
  change: TrackChange
  selected: boolean
  onSelect: (changeId: string) => void
  onAccept: (changeId: string) => boolean
  onReject: (changeId: string) => boolean
  onJump: (changeId: string) => boolean
}

const TYPE_STYLES = {
  insert: 'bg-emerald-50 text-emerald-700',
  delete: 'bg-red-50 text-red-700',
  replace: 'bg-amber-50 text-amber-700',
  format: 'bg-blue-50 text-blue-700',
} as const

function SuggestionCardComponent({
  change,
  selected,
  onSelect,
  onAccept,
  onReject,
  onJump,
}: SuggestionCardProps) {
  return (
    <article
      id={`suggestion-${change.id}`}
      className={cn(
        'border-b border-neutral-100 px-4 py-3.5 transition-colors last:border-b-0',
        selected ? 'bg-indigo-50/55 ring-2 ring-inset ring-indigo-500/20' : 'hover:bg-neutral-50',
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(change.id)}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
      >
        <span className="flex items-center gap-2">
          <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', TYPE_STYLES[change.type])}>
            {change.status === 'accepted' ? (
              <CheckCircle2 size={14} strokeWidth={2} aria-hidden />
            ) : change.status === 'rejected' ? (
              <XCircle size={14} strokeWidth={2} aria-hidden />
            ) : (
              <FilePenLine size={14} strokeWidth={2} aria-hidden />
            )}
          </span>
          <span className="min-w-0 truncate text-xs font-semibold text-neutral-900">
            {getTrackChangeLabel(change)}
          </span>
          <time
            dateTime={new Date(change.createdAt).toISOString()}
            className="ml-auto shrink-0 text-[10px] text-neutral-400"
          >
            {formatTrackChangeDate(change.createdAt)}
          </time>
        </span>
        <span className="mt-2 block text-[11px] text-neutral-500">
          {change.author.name} · <span className="capitalize">{change.status}</span>
        </span>
        {change.before && (
          <span className="mt-2 block rounded-md bg-red-50/70 px-2.5 py-1.5 text-xs leading-5 text-red-800 line-through decoration-red-400">
            {change.before}
          </span>
        )}
        {change.after && (
          <span className="mt-1.5 block rounded-md bg-emerald-50/80 px-2.5 py-1.5 text-xs leading-5 text-emerald-800">
            {change.after}
          </span>
        )}
      </button>

      <div className="mt-3 flex items-center gap-1">
        <button
          type="button"
          onClick={() => onJump(change.id)}
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
        >
          <LocateFixed size={13} aria-hidden />
          Jump
        </button>
        {change.status === 'pending' && (
          <>
            <button
              type="button"
              onClick={() => onReject(change.id)}
              className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/35"
            >
              <X size={13} strokeWidth={2.2} aria-hidden />
              Reject
            </button>
            <button
              type="button"
              onClick={() => onAccept(change.id)}
              className="inline-flex h-7 items-center gap-1.5 rounded-md bg-emerald-700 px-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
            >
              <Check size={13} strokeWidth={2.2} aria-hidden />
              Accept
            </button>
          </>
        )}
        {change.status !== 'pending' && (
          <span className="ml-auto text-[10px] font-medium capitalize text-neutral-400">
            {change.status}
          </span>
        )}
      </div>
    </article>
  )
}

export const SuggestionCard = memo(SuggestionCardComponent)
