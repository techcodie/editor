import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Command, LoaderCircle, MessageSquareText } from 'lucide-react'
import { useDocumentEditor } from '../../hooks/useDocumentEditor'
import { useEditorApi } from '../../hooks/useEditorApi'
import { cn } from '../../lib/cn'
import type { EditorApi } from '../../lib/editor-api'
import type { InternalDocumentEditorEvents } from '../../sdk/events'
import type { ResolvedDocumentEditorConfig } from '../../sdk/types'
import {
  CommandPalette,
  type WorkspaceCommandId,
} from '../CommandPalette/CommandPalette'
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary'
import { Toolbar } from '../Toolbar'
import { DocumentEditor } from '../DocumentEditor'
import { SelectionAi } from '../SelectionAI'
import type { AskDocumentCommandRequest } from '../AskDocument/AskDocumentPanel'

const AskDocumentPanel = lazy(async () => {
  const module = await import('../AskDocument/AskDocumentPanel')
  return { default: module.AskDocumentPanel }
})

/**
 * Owns the editor instance and wires it to its UI: it creates the editor, binds
 * the public {@link EditorApi} for the toolbar, and renders the editing surface.
 * The editor instance is shared via props only — no store, no context.
 */
interface EditorWorkspaceProps {
  config: ResolvedDocumentEditorConfig
  events: InternalDocumentEditorEvents
  onApiChange: (api: EditorApi | null) => void
}

export function EditorWorkspace({
  config,
  events,
  onApiChange,
}: EditorWorkspaceProps) {
  const editor = useDocumentEditor({
    placeholder: config.placeholder,
    content: config.initialContent,
    editable: !config.readonly,
  })
  const api = useEditorApi(editor)
  const [isAskDocumentOpen, setIsAskDocumentOpen] = useState(false)
  const [isAskDocumentLoaded, setIsAskDocumentLoaded] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [askDocumentCommand, setAskDocumentCommand] =
    useState<AskDocumentCommandRequest | null>(null)
  const askDocumentButtonRef = useRef<HTMLButtonElement>(null)
  const lastDocumentTextRef = useRef<string | null>(null)
  const lastSelectionRef = useRef<string | null>(null)
  const AskDocumentIcon = config.theme.icons.askDocument ?? MessageSquareText
  const CommandPaletteIcon = config.theme.icons.commandPalette ?? Command
  const availableCommands: WorkspaceCommandId[] = [
    ...(config.ai ? (['ask-ai', 'toggle-sidebar'] as const) : []),
    ...(config.ai && !config.readonly ? (['insert-last-response'] as const) : []),
    ...(config.ai && config.knowledgeSources ? (['upload-source'] as const) : []),
    ...(config.ai && config.knowledgeSources && config.preview
      ? (['open-preview'] as const)
      : []),
    'focus-editor',
  ]

  useEffect(() => {
    onApiChange(api)
    return () => onApiChange(null)
  }, [api, onApiChange])

  useEffect(() => {
    if (!api) return

    const notifyChanges = () => {
      const text = api.getDocumentText()
      if (lastDocumentTextRef.current !== text) {
        lastDocumentTextRef.current = text
        events.emit('editorChange', { text })
      }

      const selection = api.getTextSelection()
      const selectionKey = selection
        ? `${selection.from}:${selection.to}:${selection.text}`
        : ''
      if (lastSelectionRef.current !== selectionKey) {
        lastSelectionRef.current = selectionKey
        events.emit('selectionChange', { selection })
      }
    }

    notifyChanges()
    return api.subscribe(notifyChanges)
  }, [api, events])

  const openAskDocument = useCallback(() => {
    setIsAskDocumentLoaded(true)
    setIsAskDocumentOpen(true)
  }, [])

  const closeAskDocument = useCallback(() => {
    setIsAskDocumentOpen(false)
    window.requestAnimationFrame(() => askDocumentButtonRef.current?.focus())
  }, [])

  const getDocumentText = useCallback(() => api?.getDocumentText() ?? '', [api])

  const requestAskDocumentCommand = useCallback(
    (command: AskDocumentCommandRequest['command']) => {
      openAskDocument()
      setAskDocumentCommand({ id: crypto.randomUUID(), command })
    },
    [openAskDocument],
  )

  const runWorkspaceCommand = useCallback(
    (command: WorkspaceCommandId) => {
      switch (command) {
        case 'ask-ai':
          requestAskDocumentCommand('focus-input')
          break
        case 'upload-source':
          requestAskDocumentCommand('upload-source')
          break
        case 'open-preview':
          requestAskDocumentCommand('open-preview')
          break
        case 'insert-last-response':
          requestAskDocumentCommand('insert-last-response')
          break
        case 'toggle-sidebar':
          if (isAskDocumentOpen) closeAskDocument()
          else openAskDocument()
          break
        case 'focus-editor':
          api?.focus()
          break
      }
    },
    [
      api,
      closeAskDocument,
      isAskDocumentOpen,
      openAskDocument,
      requestAskDocumentCommand,
    ],
  )

  useEffect(() => {
    if (!config.keyboardShortcuts || !config.commandPalette) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLocaleLowerCase() === 'k' &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey
      ) {
        const isPaletteOpen = document.getElementById('command-palette-title') !== null
        if (
          !isPaletteOpen &&
          document.querySelector('[role="dialog"][aria-modal="true"]')
        ) {
          return
        }
        event.preventDefault()
        setIsCommandPaletteOpen((isOpen) => !isOpen)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [config.commandPalette, config.keyboardShortcuts])

  return (
    <div className="document-editor-workspace mx-auto flex w-full max-w-[84rem] items-start justify-center px-3 py-4 sm:px-6 sm:py-7 lg:px-8 lg:py-6">
      <div className="min-w-0 w-full max-w-[48rem]">
        <div className="sticky top-3 z-30 flex items-start gap-2.5 sm:top-4">
          {config.toolbar && !config.readonly && <Toolbar api={api} className="min-w-0" />}
          {config.commandPalette && (
            <button
              type="button"
              aria-label="Open command palette"
              aria-keyshortcuts={
                config.keyboardShortcuts ? 'Meta+K Control+K' : undefined
              }
              title={
                config.keyboardShortcuts
                  ? 'Command palette (Cmd/Ctrl + K)'
                  : 'Command palette'
              }
              onClick={() => setIsCommandPaletteOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white/90 text-neutral-500 shadow-[var(--document-editor-shadow-surface)] backdrop-blur-xl transition-[border-color,background-color,color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-neutral-300 hover:bg-white hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f6f4] active:translate-y-0"
            >
              <CommandPaletteIcon width={17} height={17} strokeWidth={1.9} aria-hidden />
            </button>
          )}
          {config.ai && (
            <button
              ref={askDocumentButtonRef}
              type="button"
              aria-label={
                isAskDocumentOpen ? 'Close Ask Document' : 'Open Ask Document'
              }
              aria-expanded={isAskDocumentOpen}
              aria-controls="ask-document-panel"
              title={isAskDocumentOpen ? 'Close Ask Document' : 'Ask Document'}
              onClick={() => {
                if (isAskDocumentOpen) closeAskDocument()
                else openAskDocument()
              }}
              className={cn(
                'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border shadow-[var(--document-editor-shadow-surface)] backdrop-blur-xl transition-[border-color,background-color,color,box-shadow,transform] duration-150 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f6f4] active:translate-y-0',
                isAskDocumentOpen
                  ? 'border-neutral-800 bg-neutral-900 text-white shadow-[var(--document-editor-shadow-overlay)] hover:bg-neutral-800'
                  : 'border-neutral-200 bg-white/90 text-neutral-500 hover:border-neutral-300 hover:bg-white hover:text-neutral-950',
              )}
            >
              <AskDocumentIcon
                width={18}
                height={18}
                strokeWidth={1.9}
                aria-hidden
              />
            </button>
          )}
        </div>
        <div className="pt-3.5 sm:pt-4">
          <DocumentEditor editor={editor} />
        </div>
      </div>
      <div className="shrink-0">
        {isAskDocumentLoaded && (
          <ErrorBoundary
            compact
            title="Ask Document needs a retry"
            description="The editor is still available while this panel recovers."
          >
            <Suspense
              fallback={
                <div
                  className="fixed inset-y-0 right-0 z-40 flex w-full items-center justify-center border-l border-neutral-200 bg-white sm:max-w-[24rem] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[23.5rem] lg:rounded-lg lg:border"
                  role="status"
                  aria-label="Loading Ask Document"
                >
                  <LoaderCircle
                    size={20}
                    strokeWidth={1.8}
                    className="animate-spin text-neutral-400"
                    aria-hidden
                  />
                </div>
              }
            >
              <AskDocumentPanel
                isOpen={isAskDocumentOpen}
                editorApi={api}
                getDocumentText={getDocumentText}
                commandRequest={askDocumentCommand}
                config={config}
                events={events}
                onClose={closeAskDocument}
              />
            </Suspense>
          </ErrorBoundary>
        )}
      </div>
      {config.ai && !config.readonly && (
        <ErrorBoundary compact title="Selection AI needs a retry">
          <SelectionAi
            api={api}
            endpoint={config.ai.selectionEndpoint}
            streaming={config.streaming}
            events={events}
          />
        </ErrorBoundary>
      )}
      {config.commandPalette && (
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          commands={availableCommands}
          onClose={() => setIsCommandPaletteOpen(false)}
          onSelect={runWorkspaceCommand}
        />
      )}
    </div>
  )
}
