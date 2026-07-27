import type { CommentAuthor } from '../../types/comment'

export type TrackChangeType = 'insert' | 'delete' | 'replace' | 'format'
export type TrackChangeStatus = 'pending' | 'accepted' | 'rejected'

export interface TrackChangeRange {
  from: number
  to: number
}

export interface TrackChange {
  id: string
  type: TrackChangeType
  author: CommentAuthor
  createdAt: number
  updatedAt: number
  status: TrackChangeStatus
  accepted: boolean
  rejected: boolean
  range: TrackChangeRange
  before: string
  after: string
}

export type TrackChangeFilter = 'all' | 'pending' | 'accepted' | 'rejected' | 'mine'
export type TrackChangeSort = 'newest' | 'oldest'
export type TrackChangeDecision = 'accept' | 'reject'
