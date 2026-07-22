import { useMemo } from 'react'
import type { Editor } from '@tiptap/react'
import { createEditorApi } from '../lib/editor-api'
import type { EditorApi } from '../lib/editor-api'

/** Binds a Tiptap editor to the public {@link EditorApi}, or null until ready. */
export function useEditorApi(editor: Editor | null): EditorApi | null {
  return useMemo(() => (editor ? createEditorApi(editor) : null), [editor])
}
