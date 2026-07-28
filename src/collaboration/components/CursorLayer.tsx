import type { CollaboratorDecoration } from '../services/collaborationRenderer'

export function CursorLayer({ decorations }: { decorations: CollaboratorDecoration[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-20" aria-hidden>
      {decorations.map(({ collaborator, cursorBounds }) => cursorBounds && (
        <div
          key={collaborator.clientId}
          className="absolute w-0.5 transition-[top,left,height] duration-100"
          style={{
            top: cursorBounds.top,
            left: cursorBounds.left,
            height: Math.max(18, cursorBounds.bottom - cursorBounds.top),
            backgroundColor: collaborator.color,
          }}
        >
          <span className="absolute -top-5 left-0 max-w-32 truncate rounded px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-sm" style={{ backgroundColor: collaborator.color }}>
            {collaborator.name}
          </span>
        </div>
      ))}
    </div>
  )
}
