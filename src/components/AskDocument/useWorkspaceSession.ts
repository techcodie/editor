import { useCallback, useMemo, useState } from 'react'
import { useEditorInsertion } from '../../editor/hooks/useEditorInsertion'
import { useDocumentPreview } from '../../knowledge/hooks/useDocumentPreview'
import { useKnowledgeSources } from '../../knowledge/hooks/useKnowledgeSources'
import {
  buildKnowledgeContext,
  LARGE_CONTEXT_CHARACTER_THRESHOLD,
} from '../../knowledge/services/contextBuilder'
import type { KnowledgeSource } from '../../knowledge/types/source'
import type { EditorApi } from '../../lib/editor-api'
import type { InternalDocumentEditorEvents } from '../../sdk/events'
import type { ResolvedDocumentEditorConfig } from '../../sdk/types'
import { useAskDocumentConversation } from './useAskDocumentConversation'

export function useWorkspaceSession(
  getDocumentText: () => string,
  editorApi: EditorApi | null,
  isActive: boolean,
  config: ResolvedDocumentEditorConfig,
  events: InternalDocumentEditorEvents,
) {
  const { sources, addFiles, addPreparedSource, removeSource, setSourceActive } =
    useKnowledgeSources(events)
  const { previewSource, previewFocusVersion, openPreview, closePreview } =
    useDocumentPreview(sources, events, config.preview)
  const [temporarySourceIds, setTemporarySourceIds] = useState<string[]>([])
  const [inputFocusRequest, setInputFocusRequest] = useState(0)
  const [lastSubmittedContextSize, setLastSubmittedContextSize] = useState(0)

  const temporarySources = useMemo(
    () =>
      temporarySourceIds.flatMap<KnowledgeSource>((sourceId) => {
        const source = sources.find((item) => item.id === sourceId)
        return source ? [source] : []
      }),
    [sources, temporarySourceIds],
  )

  const getKnowledgeContext = useCallback(
    () => {
      const context = buildKnowledgeContext(getDocumentText(), sources, temporarySources)
      setLastSubmittedContextSize(context.totalCharacters)
      return context
    },
    [getDocumentText, sources, temporarySources],
  )
  const conversation = useAskDocumentConversation(getKnowledgeContext, {
    endpoint: config.ai ? config.ai.askDocumentEndpoint : '/api/ask-document',
    streaming: config.streaming,
    events,
  })
  const insertion = useEditorInsertion(
    isActive && !config.readonly ? editorApi : null,
    events,
  )
  const sendConversationMessage = conversation.sendMessage
  const insertResponse = insertion.insertResponse

  const hasLargeContext = useMemo(() => {
    const sourceCharacters = sources.reduce((total, source) => {
      if (
        source.status !== 'uploaded' ||
        (!source.isActive && !temporarySourceIds.includes(source.id)) ||
        source.parseStatus !== 'ready'
      ) {
        return total
      }
      return total + (source.parsedContent?.length ?? 0)
    }, 0)

    return (
      sourceCharacters > LARGE_CONTEXT_CHARACTER_THRESHOLD ||
      lastSubmittedContextSize > LARGE_CONTEXT_CHARACTER_THRESHOLD
    )
  }, [lastSubmittedContextSize, sources, temporarySourceIds])

  const handleRemoveSource = useCallback(
    (sourceId: string) => {
      if (previewSource?.id === sourceId) closePreview()
      setTemporarySourceIds((current) => current.filter((id) => id !== sourceId))
      removeSource(sourceId)
    },
    [closePreview, previewSource?.id, removeSource],
  )

  const askAiAboutSource = useCallback(
    (source: KnowledgeSource) => {
      if (source.status !== 'uploaded' || source.parseStatus !== 'ready') return

      setTemporarySourceIds((current) =>
        current.includes(source.id) ? current : [...current, source.id],
      )
      setInputFocusRequest((request) => request + 1)
    },
    [],
  )

  const removeTemporarySource = useCallback((sourceId: string) => {
    setTemporarySourceIds((current) => current.filter((id) => id !== sourceId))
  }, [])

  const focusInput = useCallback(() => {
    setInputFocusRequest((request) => request + 1)
  }, [])

  const sendMessage = useCallback(
    (content: string) => {
      const didSend = sendConversationMessage(content)
      if (didSend) setTemporarySourceIds([])
    },
    [sendConversationMessage],
  )

  const openSourceById = useCallback(
    (sourceId: string) => {
      const source = sources.find((item) => item.id === sourceId)
      if (source) openPreview(source)
    },
    [openPreview, sources],
  )

  const previewableSourceIds = useMemo(
    () => {
      if (!config.preview) return new Set<string>()
      return new Set(
        sources
          .filter(
            (source) => source.status === 'uploaded' && source.parseStatus === 'ready',
          )
          .map((source) => source.id),
      )
    },
    [config.preview, sources],
  )

  const openFirstPreview = useCallback(() => {
    const source = sources.find(
      (item) => item.status === 'uploaded' && item.parseStatus === 'ready',
    )
    if (!source) return false
    openPreview(source)
    return true
  }, [openPreview, sources])

  const insertLastResponse = useCallback(() => {
    const message = conversation.messages.findLast(
      (item) => item.role === 'assistant' && item.content.trim().length > 0,
    )
    if (!message) return false

    void insertResponse(
      {
        responseId: message.id,
        content: message.content,
        sourceIds: message.metadata?.sources.map((source) => source.id) ?? [],
      },
      'cursor',
    )
    return true
  }, [conversation.messages, insertResponse])

  return {
    sources,
    temporarySources,
    previewSource,
    previewFocusVersion,
    inputFocusRequest,
    hasLargeContext,
    previewableSourceIds,
    insertion,
    conversation: {
      ...conversation,
      sendMessage,
    },
    addFiles,
    addPreparedSource,
    removeSource: handleRemoveSource,
    setSourceActive,
    openPreview,
    closePreview,
    openSourceById,
    askAiAboutSource,
    removeTemporarySource,
    focusInput,
    openFirstPreview,
    insertLastResponse,
  }
}
