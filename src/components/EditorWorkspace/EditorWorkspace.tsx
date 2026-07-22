import { useDocumentEditor } from '../../hooks/useDocumentEditor'
import { useEditorApi } from '../../hooks/useEditorApi'
import { Toolbar } from '../Toolbar'
import { DocumentEditor } from '../DocumentEditor'

const PLACEHOLDER = 'Start writing…'

/**
 * Owns the editor instance and wires it to its UI: it creates the editor, binds
 * the public {@link EditorApi} for the toolbar, and renders the editing surface.
 * The editor instance is shared via props only — no store, no context.
 */
export function EditorWorkspace() {
  const editor = useDocumentEditor({ placeholder: PLACEHOLDER })
  const api = useEditorApi(editor)

  return (
    <div className="mx-auto w-full max-w-[46rem] px-4 py-6 sm:py-10">
      <Toolbar api={api} sticky />
      <div className="pt-4">
        <DocumentEditor editor={editor} />
      </div>
    </div>
  )
}
