import type { Editor } from '@tiptap/react'

/** Options required to configure the underlying editor instance. */
export interface DocumentEditorOptions {
  /** Text shown while the document is empty. */
  placeholder: string
  /** Initial HTML, text, or ProseMirror-compatible JSON. */
  content?: string | Record<string, unknown>
  /** Whether direct editing is enabled. */
  editable?: boolean
}

/** Internal props for the Tiptap editing surface. */
export interface DocumentEditorProps {
  /** The editor instance to render. Null while it initializes. */
  editor: Editor | null
  /** Additional classes merged onto the editor container. */
  className?: string
  /** Called after a click positions the editor selection. */
  onSurfaceClick?: () => void
  /** Exposes pending placement to the editing surface. */
  placementActive?: boolean
}
