import type { CollaboratorDecoration } from '../services/collaborationRenderer'

export function SelectionLayer({ decorations }: { decorations: CollaboratorDecoration[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-10" aria-hidden>
      {decorations.map(({ collaborator, selectionBounds }) => selectionBounds && (
        <div
          key={collaborator.clientId}
          className="absolute rounded-sm opacity-20 transition-[top,left,width,height] duration-100"
          style={{
            top: selectionBounds.top,
            left: selectionBounds.left,
            width: Math.max(2, selectionBounds.right - selectionBounds.left),
            height: Math.max(18, selectionBounds.bottom - selectionBounds.top),
            backgroundColor: collaborator.color,
          }}
        />
      ))}
    </div>
  )
}
