import { memo } from 'react'
import { cn } from '../../lib/cn'
import type { TrackChange } from '../../review/trackChanges/types/trackChange'
import type { DiffSegment } from '../types/diff'

interface DiffSegmentTextProps {
  segment: DiffSegment
  change: TrackChange | null
  selected: boolean
  pane: 'left' | 'right' | 'unified'
  onSelect: (changeId: string) => void
}

function DiffSegmentTextComponent({
  segment,
  change,
  selected,
  pane,
  onSelect,
}: DiffSegmentTextProps) {
  if (!segment.changeId || !segment.type || !change) return <>{segment.value}</>

  const isBefore = segment.role === 'before'
  const isRejected = change.status === 'rejected'
  const isAccepted = change.status === 'accepted'
  return (
    <button
      id={`${pane}-comparison-segment-${segment.id}`}
      type="button"
      onClick={() => onSelect(segment.changeId as string)}
      data-comparison-change={segment.changeId}
      data-comparison-pane={pane}
      data-change-status={change.status}
      className={cn(
        'inline whitespace-pre-wrap rounded-[3px] px-0.5 text-left transition-[background-color,box-shadow,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/45',
        segment.type === 'format'
          ? 'border-b-2 border-blue-500 bg-blue-50 text-blue-900'
          : isBefore
            ? 'bg-red-100/80 text-red-900 line-through decoration-red-500'
            : 'bg-emerald-100/90 text-emerald-900 underline decoration-emerald-500 decoration-2 underline-offset-2',
        selected && 'relative z-10 shadow-[0_0_0_2px_rgba(99,102,241,0.38)]',
        (isRejected && !isBefore) || (isAccepted && isBefore) ? 'opacity-30' : '',
      )}
      title={`${change.type} · ${change.status}`}
    >
      {segment.value}
    </button>
  )
}

export const DiffSegmentText = memo(DiffSegmentTextComponent)
