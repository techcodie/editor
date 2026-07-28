export type CollaboratorStatus = 'online' | 'away' | 'offline'

export interface CollaborationUser {
  id: string
  name: string
  color: string
  avatarUrl?: string
}

export interface CollaborationRange {
  from: number
  to: number
}

export interface Collaborator extends CollaborationUser {
  clientId: string
  cursor: number | null
  selection: CollaborationRange | null
  status: CollaboratorStatus
  typing: boolean
  lastSeen: number
}

export interface AwarenessState {
  user: CollaborationUser
  clientId: string
  cursor: number | null
  selection: CollaborationRange | null
  status: CollaboratorStatus
  typing: boolean
  lastSeen: number
}
