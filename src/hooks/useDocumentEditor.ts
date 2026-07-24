import { useEditor } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import { createEditorExtensions } from '../extensions'
import type { DocumentEditorOptions } from '../types/editor'

/** Creates and owns the Tiptap editor instance for a document. */
export function useDocumentEditor({
  placeholder,
  content,
  editable = true,
}: DocumentEditorOptions): Editor | null {
  return useEditor({
    immediatelyRender: true,
    extensions: createEditorExtensions({ placeholder }),
    content,
    editable,
    editorProps: {
      attributes: {
        'aria-label': 'Document content',
        spellcheck: 'true',
      },
    },
  })
}
