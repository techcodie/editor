import { useCallback, useRef, useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import { useDocumentEditor } from '../../hooks/useDocumentEditor'
import { useEditorApi } from '../../hooks/useEditorApi'
import { cn } from '../../lib/cn'
import { Toolbar } from '../Toolbar'
import { DocumentEditor } from '../DocumentEditor'
import { AskDocumentPanel } from '../AskDocument'

const PLACEHOLDER = 'Start writing…'

/**
 * Owns the editor instance and wires it to its UI: it creates the editor, binds
 * the public {@link EditorApi} for the toolbar, and renders the editing surface.
 * The editor instance is shared via props only — no store, no context.
 */
export function EditorWorkspace() {
  const editor = useDocumentEditor({ placeholder: PLACEHOLDER })
  const api = useEditorApi(editor)
  const [isAskDocumentOpen, setIsAskDocumentOpen] = useState(false)
  const askDocumentButtonRef = useRef<HTMLButtonElement>(null)

  const closeAskDocument = useCallback(() => {
    setIsAskDocumentOpen(false)
    window.requestAnimationFrame(() => askDocumentButtonRef.current?.focus())
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-[82rem] items-start justify-center gap-4 px-4 py-6 sm:py-10 lg:py-6">
      <div className="min-w-0 w-full max-w-[46rem]">
        <div className="sticky top-4 z-30 flex items-start gap-2">
          <Toolbar api={api} className="min-w-0" />
          <button
            ref={askDocumentButtonRef}
            type="button"
            aria-label={isAskDocumentOpen ? 'Close Ask Document' : 'Open Ask Document'}
            aria-expanded={isAskDocumentOpen}
            aria-controls="ask-document-panel"
            title={isAskDocumentOpen ? 'Close Ask Document' : 'Ask Document'}
            onClick={() => setIsAskDocumentOpen((isOpen) => !isOpen)}
            className={cn(
              'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-white/85 shadow-[0_1px_2px_rgba(16,15,15,0.04),0_10px_30px_-16px_rgba(16,15,15,0.12)] backdrop-blur-md transition-[border-color,background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40',
              isAskDocumentOpen
                ? 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                : 'border-neutral-200/80 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900',
            )}
          >
            <MessageSquareText size={18} strokeWidth={1.9} aria-hidden />
          </button>
        </div>
        <div className="pt-4">
          <DocumentEditor editor={editor} />
        </div>
      </div>
      <div className="shrink-0">
        <AskDocumentPanel
          isOpen={isAskDocumentOpen}
          onClose={closeAskDocument}
        />
      </div>
    </div>
  )
}
