import type { Collaborator, CollaborationUser } from '../types/presence'

interface UserBadgeProps {
  user: CollaborationUser | Collaborator
  size?: 'small' | 'medium'
  showStatus?: boolean
}

export function UserBadge({ user, size = 'medium', showStatus = false }: UserBadgeProps) {
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
  const status = 'status' in user ? user.status : 'online'

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white font-semibold text-white shadow-sm ${size === 'small' ? 'h-6 w-6 text-[8px]' : 'h-8 w-8 text-[10px]'}`}
      style={{ backgroundColor: user.color }}
      title={user.name}
      aria-label={`${user.name}, ${status}`}
    >
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : initials}
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white ${status === 'online' ? 'bg-emerald-500' : status === 'away' ? 'bg-amber-400' : 'bg-neutral-300'}`}
          aria-hidden
        />
      )}
    </span>
  )
}
