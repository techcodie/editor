import { useCallback, useMemo, useState } from 'react'
import { useDocumentPreview } from '../../knowledge/hooks/useDocumentPreview'
import { useKnowledgeSources } from '../../knowledge/hooks/useKnowledgeSources'
import {
  buildKnowledgeContext,
  LARGE_CONTEXT_CHARACTER_THRESHOLD,
} from '../../knowledge/services/contextBuilder'
import type { KnowledgeSource } from '../../knowledge/types/source'
import { useAskDocumentConversation } from './useAskDocumentConversation'

export function useWorkspaceSession(getDocumentText: () => string) {
  const { sources, addFiles, removeSource, setSourceActive } = useKnowledgeSources()
  const { previewSource, previewFocusVersion, openPreview, closePreview } =
    useDocumentPreview(sources)
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
  const conversation = useAskDocumentConversation(getKnowledgeContext)
  const sendConversationMessage = conversation.sendMessage

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
    () =>
      new Set(
        sources
          .filter(
            (source) => source.status === 'uploaded' && source.parseStatus === 'ready',
          )
          .map((source) => source.id),
      ),
    [sources],
  )

  return {
    sources,
    temporarySources,
    previewSource,
    previewFocusVersion,
    inputFocusRequest,
    hasLargeContext,
    previewableSourceIds,
    conversation: {
      ...conversation,
      sendMessage,
    },
    addFiles,
    removeSource: handleRemoveSource,
    setSourceActive,
    openPreview,
    closePreview,
    openSourceById,
    askAiAboutSource,
    removeTemporarySource,
  }
}
