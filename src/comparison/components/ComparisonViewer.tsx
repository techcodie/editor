import type { TrackChange } from '../../review/trackChanges/types/trackChange'
import type { ComparisonDocument, ComparisonViewMode } from '../types/comparison'
import type { DiffSegment } from '../types/diff'
import { SplitViewer } from './SplitViewer'
import { UnifiedViewer } from './UnifiedViewer'

interface ComparisonViewerProps {
  viewMode: ComparisonViewMode
  leftDocument: ComparisonDocument
  rightDocument: ComparisonDocument
  segments: DiffSegment[]
  changes: TrackChange[]
  selectedChangeId: string | null
  onSelectChange: (changeId: string) => void
}

export function ComparisonViewer({
  viewMode,
  leftDocument,
  rightDocument,
  segments,
  changes,
  selectedChangeId,
  onSelectChange,
}: ComparisonViewerProps) {
  return viewMode === 'split' ? (
    <SplitViewer
      leftDocument={leftDocument}
      rightDocument={rightDocument}
      segments={segments}
      changes={changes}
      selectedChangeId={selectedChangeId}
      onSelectChange={onSelectChange}
    />
  ) : (
    <UnifiedViewer
      segments={segments}
      changes={changes}
      selectedChangeId={selectedChangeId}
      onSelectChange={onSelectChange}
    />
  )
}
