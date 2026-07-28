import { useEffect, useRef, useState } from 'react'
import { Users } from 'lucide-react'
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

  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    window.addEventListener('keydown', closeWithEscape)
    return () => {
      document.removeEventListener('pointerdown', close)
      window.removeEventListener('keydown', closeWithEscape)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={`${collaborators.length} collaborators in this document`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white/90 px-2.5 text-neutral-600 shadow-[var(--document-editor-shadow-surface)] backdrop-blur-xl transition-[border-color,background-color,box-shadow,transform] hover:-translate-y-px hover:border-neutral-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-2"
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
