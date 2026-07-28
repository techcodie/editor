import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ReplacementDiffDialog } from '../../editor/components/ReplacementDiffDialog'
import { KnowledgeSources } from '../../knowledge'
import type { KnowledgeSource, PreparedKnowledgeSource } from '../../knowledge/types/source'
import { cn } from '../../lib/cn'
import type { EditorApi } from '../../lib/editor-api'
import type { InternalDocumentEditorEvents } from '../../sdk/events'
import type { ResolvedDocumentEditorConfig } from '../../sdk/types'
import { ChatConversation } from './ChatConversation'
import { ChatHeader } from './ChatHeader'
import { ChatInput } from './ChatInput'
import { useWorkspaceSession } from './useWorkspaceSession'

const DocumentPreview = lazy(async () => {
  const module = await import('../../knowledge/preview/DocumentPreview')
  return { default: module.DocumentPreview }
})

export type AskDocumentCommand =
  | 'focus-input'
  | 'upload-source'
  | 'open-preview'
  | 'insert-last-response'
  | 'add-prepared-source'
  | 'ask-question'
  | 'open-source'

export interface AskDocumentCommandRequest {
  id: string
  command: AskDocumentCommand
  preparedSource?: PreparedKnowledgeSource
  question?: string
  sourceId?: string
}

export interface AskDocumentPanelProps {
  isOpen: boolean
  editorApi: EditorApi | null
  getDocumentText: () => string
  commandRequest?: AskDocumentCommandRequest | null
  config: ResolvedDocumentEditorConfig
  events: InternalDocumentEditorEvents
  onSourcesChange?: (sources: KnowledgeSource[]) => void
  onClose: () => void
}

export function AskDocumentPanel({
  isOpen,
  editorApi,
  getDocumentText,
  commandRequest,
  config,
  events,
  onSourcesChange,
  onClose,
}: AskDocumentPanelProps) {
  const session = useWorkspaceSession(
    getDocumentText,
    editorApi,
    isOpen,
    config,
    events,
  )
  const [uploadRequest, setUploadRequest] = useState(0)
  const [commandNotice, setCommandNotice] = useState<string | null>(null)
  const handledCommandRef = useRef<string | null>(null)
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    retryLastMessage,
    cancelRequest,
    clearConversation,
  } = session.conversation
  const {
    closePreview,
    focusInput,
    insertLastResponse,
    openFirstPreview,
    openSourceById,
    addPreparedSource,
  } = session

  useEffect(() => {
    onSourcesChange?.(session.sources)
  }, [onSourcesChange, session.sources])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        !document.querySelector('[role="dialog"]')
      ) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) closePreview()
  }, [closePreview, isOpen])

  useEffect(() => {
    if (!isOpen || !commandRequest) return
    if (handledCommandRef.current === commandRequest.id) return
    handledCommandRef.current = commandRequest.id

    switch (commandRequest.command) {
      case 'focus-input':
        setCommandNotice(null)
        focusInput()
        break
      case 'upload-source':
        setCommandNotice(null)
        setUploadRequest((request) => request + 1)
        break
      case 'open-preview':
        setCommandNotice(
          openFirstPreview()
            ? null
            : 'Add a readable knowledge source before opening Preview.',
        )
        break
      case 'insert-last-response':
        setCommandNotice(
          insertLastResponse()
            ? null
            : 'Ask a question before inserting the latest response.',
        )
        break
      case 'add-prepared-source':
        if (commandRequest.preparedSource) {
          addPreparedSource(commandRequest.preparedSource)
          setCommandNotice(`${commandRequest.preparedSource.name} is ready as an active source.`)
        }
        break
      case 'ask-question':
        if (commandRequest.question?.trim()) {
          setCommandNotice(null)
          void sendMessage(commandRequest.question)
        }
        break
      case 'open-source':
        if (commandRequest.sourceId) {
          openSourceById(commandRequest.sourceId)
        }
        break
    }
  }, [
    commandRequest,
    addPreparedSource,
    focusInput,
    insertLastResponse,
    isOpen,
    openFirstPreview,
    openSourceById,
    sendMessage,
  ])

  useEffect(() => {
    if (!commandNotice) return
    const timeout = window.setTimeout(() => setCommandNotice(null), 3600)
    return () => window.clearTimeout(timeout)
  }, [commandNotice])

  return (
    <aside
      id="ask-document-panel"
      aria-labelledby="ask-document-title"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        'fixed inset-y-0 right-0 z-40 flex w-full max-w-none flex-col overflow-hidden border-l border-neutral-200 bg-white shadow-[var(--document-editor-shadow-overlay)] transition-[transform,opacity,width] duration-300 ease-out sm:max-w-[24rem]',
        'lg:sticky lg:top-6 lg:z-20 lg:h-[calc(100vh-3rem)] lg:max-w-none lg:rounded-lg lg:border lg:shadow-[var(--document-editor-shadow-surface)]',
        isOpen
          ? 'translate-x-0 opacity-100 lg:w-[23.5rem]'
          : 'pointer-events-none translate-x-full opacity-0 lg:w-0 lg:translate-x-0 lg:border-transparent',
      )}
    >
      <div className="flex h-full w-full min-w-0 flex-col lg:w-[23.5rem]">
        <ChatHeader
          canClear={messages.length > 0 || isLoading || error !== null}
          onClear={clearConversation}
          onClose={onClose}
        />
        {commandNotice && (
          <p
            className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-[11px] leading-4 text-amber-800"
            role="status"
          >
            {commandNotice}
          </p>
        )}
        <ChatConversation
          messages={messages}
          isLoading={isLoading}
          error={error}
          onSelectSuggestion={sendMessage}
          onRetry={retryLastMessage}
          onCancelGeneration={cancelRequest}
          regeneratableMessageId={session.conversation.regeneratableMessageId}
          previewableSourceIds={session.previewableSourceIds}
          onRegenerate={session.conversation.regenerateMessage}
          onOpenSource={session.openSourceById}
          canInsert={session.insertion.canInsert}
          canReplaceSelection={session.insertion.canReplaceSelection}
          insertionFeedback={session.insertion.feedback}
          onInsertResponse={session.insertion.insertResponse}
          onRequestReplacement={session.insertion.requestReplacement}
        />
        {config.knowledgeSources && (
          <KnowledgeSources
            sources={session.sources}
            hasLargeContext={session.hasLargeContext}
            previewEnabled={config.preview}
            onAddFiles={session.addFiles}
            onRemoveSource={session.removeSource}
            onSourceActiveChange={session.setSourceActive}
            onPreviewSource={session.openPreview}
            uploadRequest={uploadRequest}
          />
        )}
        <ChatInput
          disabled={isLoading}
          isActive={isOpen}
          focusRequest={session.inputFocusRequest}
          temporarySources={session.temporarySources}
          voiceEnabled={config.voice}
          keyboardShortcuts={config.keyboardShortcuts}
          onRemoveTemporarySource={session.removeTemporarySource}
          onSend={sendMessage}
        />
      </div>
      {config.preview && session.previewSource && (
        <Suspense fallback={null}>
          <DocumentPreview
            source={session.previewSource}
            focusVersion={session.previewFocusVersion}
            onAskAi={session.askAiAboutSource}
            onClose={session.closePreview}
          />
        </Suspense>
      )}
      {session.insertion.pendingReplacement && (
        <ReplacementDiffDialog
          original={session.insertion.pendingReplacement.original}
          replacement={
            session.insertion.pendingReplacement.prepared.response.content
          }
          onApply={session.insertion.applyReplacement}
          onCancel={session.insertion.cancelReplacement}
        />
      )}
    </aside>
  )
}
