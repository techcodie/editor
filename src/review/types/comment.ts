export interface CommentAuthor {
  id: string
  name: string
  avatarUrl?: string
}

export interface CommentAnchor {
  from: number
  to: number
  quote: string
}

export interface Reply {
  id: string
  author: CommentAuthor
  text: string
  createdAt: number
}

export type CommentStatus = 'active' | 'resolved'

export interface Comment {
  id: string
  author: CommentAuthor
  createdAt: number
  updatedAt: number
  status: CommentStatus
  resolved: boolean
  text: string
  anchor: CommentAnchor
  replies: Reply[]
}
