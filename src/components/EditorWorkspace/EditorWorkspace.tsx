import { useCallback, useRef, useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import { useDocumentEditor } from '../../hooks/useDocumentEditor'
import { useEditorApi } from '../../hooks/useEditorApi'
import { cn } from '../../lib/cn'
import { Toolbar } from '../Toolbar'
import { DocumentEditor } from '../DocumentEditor'
import { AskDocumentPanel } from '../AskDocument'
import { SelectionAi } from '../SelectionAI'

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

  const getDocumentText = useCallback(() => api?.getDocumentText() ?? '', [api])

  return (
    <div className="mx-auto flex w-full max-w-[84rem] items-start justify-center gap-5 px-3 py-4 sm:px-6 sm:py-7 lg:px-8 lg:py-6">
      <div className="min-w-0 w-full max-w-[48rem]">
        <div className="sticky top-3 z-30 flex items-start gap-2.5 sm:top-4">
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
              'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border shadow-[0_1px_2px_rgba(20,20,20,0.04),0_8px_24px_-16px_rgba(20,20,20,0.28)] backdrop-blur-xl transition-[border-color,background-color,color,box-shadow,transform] duration-150 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f6f4] active:translate-y-0',
              isAskDocumentOpen
                ? 'border-neutral-800 bg-neutral-900 text-white shadow-[0_8px_24px_-14px_rgba(23,23,23,0.6)] hover:bg-neutral-800'
                : 'border-neutral-200 bg-white/90 text-neutral-500 hover:border-neutral-300 hover:bg-white hover:text-neutral-950',
            )}
          >
            <MessageSquareText size={18} strokeWidth={1.9} aria-hidden />
          </button>
        </div>
        <div className="pt-3.5 sm:pt-4">
          <DocumentEditor editor={editor} />
        </div>
      </div>
      <div className="shrink-0">
        <AskDocumentPanel
          isOpen={isAskDocumentOpen}
          getDocumentText={getDocumentText}
          onClose={closeAskDocument}
        />
      </div>
      <SelectionAi api={api} />
    </div>
  )
}
