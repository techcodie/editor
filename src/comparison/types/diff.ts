import type { TrackChangeType } from '../../review/trackChanges/types/trackChange'

export type DiffSegmentRole = 'unchanged' | 'before' | 'after'

export interface DiffSegment {
  id: string
  changeId: string | null
  type: TrackChangeType | null
  role: DiffSegmentRole
  value: string
  leftStart: number
  leftEnd: number
  rightStart: number
  rightEnd: number
}

export interface DiffResult {
  segments: DiffSegment[]
  changes: import('../../review/trackChanges/types/trackChange').TrackChange[]
}
