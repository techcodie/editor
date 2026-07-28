import type { CollaborationUser } from '../types/presence'

const COLORS = ['#4f46e5', '#0f766e', '#b45309', '#be123c', '#0369a1', '#7e22ce']

export function collaborationUserColor(id: string): string {
  let hash = 0
  for (const character of id) hash = Math.imul(hash, 31) + character.charCodeAt(0) | 0
  return COLORS[Math.abs(hash) % COLORS.length]
}

export function createGuestCollaborationUser(): CollaborationUser {
  const id = crypto.randomUUID()
  return {
    id,
    name: `Guest ${id.slice(0, 4).toUpperCase()}`,
    color: collaborationUserColor(id),
  }
}
