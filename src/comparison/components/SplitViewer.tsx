import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import type { TrackChange } from '../../review/trackChanges/types/trackChange'
import { createDiffLines } from '../services/diffRenderer'
import type { ComparisonDocument } from '../types/comparison'
import type { DiffSegment } from '../types/diff'
import { DiffSegmentText } from './DiffSegmentText'

interface SplitViewerProps {
  leftDocument: ComparisonDocument
  rightDocument: ComparisonDocument
  segments: DiffSegment[]
  changes: TrackChange[]
  selectedChangeId: string | null
  onSelectChange: (changeId: string) => void
}

function SplitViewerComponent({
  leftDocument,
  rightDocument,
  segments,
  changes,
  selectedChangeId,
  onSelectChange,
}: SplitViewerProps) {
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const syncingRef = useRef(false)
  const frameRef = useRef<number | null>(null)
  const changesById = useMemo(
    () => new Map(changes.map((change) => [change.id, change])),
    [changes],
  )
  const paneLines = useMemo(() => ({
    left: createDiffLines(
      segments.filter((segment) => segment.role === 'unchanged' || segment.role === 'before'),
    ),
    right: createDiffLines(
      segments.filter((segment) => segment.role === 'unchanged' || segment.role === 'after'),
    ),
  }), [segments])

  const synchronizeScroll = useCallback((source: HTMLDivElement, target: HTMLDivElement) => {
    if (syncingRef.current) return
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => {
      const sourceRange = source.scrollHeight - source.clientHeight
      const targetRange = target.scrollHeight - target.clientHeight
      syncingRef.current = true
      target.scrollTop = sourceRange > 0 ? (source.scrollTop / sourceRange) * targetRange : 0
      requestAnimationFrame(() => {
        syncingRef.current = false
      })
    })
  }, [])

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
  }, [])

  useEffect(() => {
    if (!selectedChangeId) return
    const leftTarget = document.querySelector<HTMLElement>(
      `[data-comparison-pane="left"][data-comparison-change="${selectedChangeId}"]`,
    )
    const rightTarget = document.querySelector<HTMLElement>(
      `[data-comparison-pane="right"][data-comparison-change="${selectedChangeId}"]`,
    )
    leftTarget?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    rightTarget?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [selectedChangeId])

  const panes = [
    { id: 'left' as const, document: leftDocument, ref: leftRef },
    { id: 'right' as const, document: rightDocument, ref: rightRef },
  ]

  return (
    <div className="grid h-full min-h-0 grid-cols-1 divide-y divide-neutral-200 md:grid-cols-2 md:divide-x md:divide-y-0">
      {panes.map((pane) => (
        <section key={pane.id} className="flex min-h-0 flex-col" aria-label={`${pane.document.name} comparison pane`}>
          <header className="flex h-10 shrink-0 items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4">
            <strong className="truncate text-[11px] font-semibold text-neutral-800">{pane.document.name}</strong>
            <span className="ml-3 shrink-0 text-[10px] capitalize text-neutral-400">{pane.document.kind}</span>
          </header>
          <div
            ref={pane.ref}
            onScroll={(event) => {
              const target = pane.id === 'left' ? rightRef.current : leftRef.current
              if (target) synchronizeScroll(event.currentTarget, target)
            }}
            className="comparison-document-scroll min-h-0 flex-1 overflow-auto overscroll-contain bg-white"
          >
            <div className="comparison-document-content min-h-full whitespace-pre-wrap px-5 py-6 font-serif text-[15px] leading-7 text-neutral-800 sm:px-7 sm:py-8">
              {paneLines[pane.id].map((line, lineIndex) => (
                <div key={`${pane.id}-line-${lineIndex}`} className="comparison-virtual-line min-h-7">
                  {line.map((segment) => (
                    <DiffSegmentText
                      key={`${pane.id}-${segment.id}`}
                      segment={segment}
                      change={segment.changeId ? changesById.get(segment.changeId) ?? null : null}
                      selected={segment.changeId === selectedChangeId}
                      pane={pane.id}
                      onSelect={onSelectChange}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}

export const SplitViewer = memo(SplitViewerComponent)
