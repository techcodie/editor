import type { Editor } from '@tiptap/react'

/** Options required to configure the underlying editor instance. */
export interface DocumentEditorOptions {
  /** Text shown while the document is empty. */
  placeholder: string
}

/** Public props for the `DocumentEditor` surface. */
export interface DocumentEditorProps {
  /** The editor instance to render. Null while it initializes. */
  editor: Editor | null
  /** Additional classes merged onto the editor container. */
  className?: string
}
