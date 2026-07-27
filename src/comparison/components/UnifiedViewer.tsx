import { memo, useEffect, useMemo } from 'react'
import type { TrackChange } from '../../review/trackChanges/types/trackChange'
import { createDiffLines } from '../services/diffRenderer'
import type { DiffSegment } from '../types/diff'
import { DiffSegmentText } from './DiffSegmentText'

interface UnifiedViewerProps {
  segments: DiffSegment[]
  changes: TrackChange[]
  selectedChangeId: string | null
  onSelectChange: (changeId: string) => void
}

function UnifiedViewerComponent({
  segments,
  changes,
  selectedChangeId,
  onSelectChange,
}: UnifiedViewerProps) {
  const changesById = useMemo(
    () => new Map(changes.map((change) => [change.id, change])),
    [changes],
  )
  const lines = useMemo(() => createDiffLines(segments), [segments])

  useEffect(() => {
    if (!selectedChangeId) return
    document
      .querySelector<HTMLElement>(
        `[data-comparison-pane="unified"][data-comparison-change="${selectedChangeId}"]`,
      )
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [selectedChangeId])

  return (
    <section className="comparison-document-scroll h-full min-h-0 overflow-auto overscroll-contain bg-white" aria-label="Unified comparison">
      <div className="comparison-document-content mx-auto min-h-full max-w-[58rem] whitespace-pre-wrap px-5 py-7 font-serif text-[15px] leading-7 text-neutral-800 sm:px-10 sm:py-10">
        {lines.map((line, lineIndex) => (
          <div key={`unified-line-${lineIndex}`} className="comparison-virtual-line min-h-7">
            {line.map((segment) => (
              <DiffSegmentText
                key={segment.id}
                segment={segment}
                change={segment.changeId ? changesById.get(segment.changeId) ?? null : null}
                selected={segment.changeId === selectedChangeId}
                pane="unified"
                onSelect={onSelectChange}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

export const UnifiedViewer = memo(UnifiedViewerComponent)
