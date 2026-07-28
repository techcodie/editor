import type { EditorApi, EditorSelectionBounds } from '../../lib/editor-api'
import type { Collaborator } from '../types/presence'

export interface CollaboratorDecoration {
  collaborator: Collaborator
  cursorBounds: EditorSelectionBounds | null
  selectionBounds: EditorSelectionBounds | null
}

export function renderCollaboratorDecorations(
  api: EditorApi | null,
  collaborators: Collaborator[],
): CollaboratorDecoration[] {
  if (!api) return []
  return collaborators.flatMap((collaborator) => {
    try {
      return [{
        collaborator,
        cursorBounds: collaborator.cursor === null
          ? null
          : api.getRangeBounds(collaborator.cursor, collaborator.cursor),
        selectionBounds: collaborator.selection
          ? api.getRangeBounds(collaborator.selection.from, collaborator.selection.to)
          : null,
      }]
    } catch {
      return []
    }
  })
}
