import { useEffect, useRef, useState } from 'react'
import { Users } from 'lucide-react'
import { useOverlayStack } from '../../hooks/useOverlayStack'
import type {
  CollaborationConnectionStatus,
  CollaborationSyncStatus,
} from '../types/collaboration'
import type { Collaborator, CollaborationUser } from '../types/presence'
import type { Workflow } from '../../workflow/types/workflow'
import { CollaboratorList } from './CollaboratorList'
import { UserBadge } from './UserBadge'

interface PresenceBarProps {
  collaborators: Collaborator[]
  currentUser: CollaborationUser
  connectionStatus: CollaborationConnectionStatus
  syncStatus: CollaborationSyncStatus
  activeEditor: Collaborator | null
  onReconnect(): void
  workflow?: Workflow | null
}

export function PresenceBar({
  collaborators,
  currentUser,
  connectionStatus,
  syncStatus,
  activeEditor,
  onReconnect,
  workflow,
}: PresenceBarProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const visible = collaborators.slice(0, 3)
  const isTopmost = useOverlayStack(open)

  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isTopmost()) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    window.addEventListener('keydown', closeWithEscape)
    return () => {
      document.removeEventListener('pointerdown', close)
      window.removeEventListener('keydown', closeWithEscape)
    }
  }, [isTopmost, open])

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={`${collaborators.length} collaborators in this document`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 items-center gap-1.5 rounded-md px-2 text-neutral-600 transition-[background-color,color] hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
      >
        <span className="flex -space-x-2" aria-hidden>
          {(visible.length ? visible : [{ ...currentUser, clientId: currentUser.id, cursor: null, selection: null, status: 'online' as const, typing: false, lastSeen: Date.now() }]).map((collaborator) => (
            <UserBadge key={collaborator.clientId} user={collaborator} size="small" />
          ))}
        </span>
        <span className="hidden max-w-24 truncate text-[11px] font-medium sm:block">
          {activeEditor ? `${activeEditor.name} editing` : `${collaborators.length} online`}
        </span>
        <Users size={14} strokeWidth={1.9} aria-hidden />
      </button>
      {open && (
        <CollaboratorList
          collaborators={collaborators}
          currentUserId={currentUser.id}
          connectionStatus={connectionStatus}
          syncStatus={syncStatus}
          onReconnect={onReconnect}
          workflow={workflow}
        />
      )}
    </div>
  )
}
