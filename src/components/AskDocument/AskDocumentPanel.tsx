import { useEffect } from 'react'
import { ReplacementDiffDialog } from '../../editor/components/ReplacementDiffDialog'
import { KnowledgeSources } from '../../knowledge'
import { DocumentPreview } from '../../knowledge/preview/DocumentPreview'
import { cn } from '../../lib/cn'
import type { EditorApi } from '../../lib/editor-api'
import { ChatConversation } from './ChatConversation'
import { ChatHeader } from './ChatHeader'
import { ChatInput } from './ChatInput'
import { useWorkspaceSession } from './useWorkspaceSession'

interface AskDocumentPanelProps {
  isOpen: boolean
  editorApi: EditorApi | null
  getDocumentText: () => string
  onClose: () => void
}

export function AskDocumentPanel({
  isOpen,
  editorApi,
  getDocumentText,
  onClose,
}: AskDocumentPanelProps) {
  const session = useWorkspaceSession(getDocumentText, editorApi, isOpen)
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    retryLastMessage,
    clearConversation,
  } = session.conversation
  const { closePreview } = session

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

  return (
    <aside
      id="ask-document-panel"
      aria-labelledby="ask-document-title"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        'fixed inset-y-0 right-0 z-40 flex w-full max-w-none flex-col overflow-hidden border-l border-neutral-200 bg-white shadow-[-20px_0_50px_-28px_rgba(23,23,23,0.3)] transition-[transform,opacity,width] duration-300 ease-out sm:max-w-[24rem]',
        'lg:sticky lg:top-6 lg:z-20 lg:h-[calc(100vh-3rem)] lg:max-w-none lg:rounded-lg lg:border lg:shadow-[0_1px_2px_rgba(20,20,20,0.04),0_18px_48px_-28px_rgba(20,20,20,0.32)]',
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
        <ChatConversation
          messages={messages}
          isLoading={isLoading}
          error={error}
          onSelectSuggestion={sendMessage}
          onRetry={retryLastMessage}
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
        <KnowledgeSources
          sources={session.sources}
          hasLargeContext={session.hasLargeContext}
          onAddFiles={session.addFiles}
          onRemoveSource={session.removeSource}
          onSourceActiveChange={session.setSourceActive}
          onPreviewSource={session.openPreview}
        />
        <ChatInput
          disabled={isLoading}
          isActive={isOpen}
          focusRequest={session.inputFocusRequest}
          temporarySources={session.temporarySources}
          onRemoveTemporarySource={session.removeTemporarySource}
          onSend={sendMessage}
        />
      </div>
      <DocumentPreview
        source={session.previewSource}
        focusVersion={session.previewFocusVersion}
        onAskAi={session.askAiAboutSource}
        onClose={session.closePreview}
      />
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
