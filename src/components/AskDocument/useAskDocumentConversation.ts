import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ASK_DOCUMENT_HISTORY_LIMIT,
  type AskDocumentHistoryMessage,
  type AskDocumentResponseMetadata,
} from '../../../shared/ask-document'
import {
  buildAskDocumentRequest,
  type KnowledgeContext,
} from '../../knowledge/services/contextBuilder'
import { AskDocumentServiceError, streamAskDocument } from '../../services/ask-document'
import { createFrameStreamBuffer } from '../../services/frame-stream-buffer'
import type {
  AssistantResponseMetadata,
  ChatMessage,
  ChatRole,
  ConversationError,
} from './types'

interface PendingRequest {
  question: string
  history: AskDocumentHistoryMessage[]
  context: KnowledgeContext
}

interface CompletedRequest {
  messageId: string
  request: PendingRequest
}

function createMessage(
  role: ChatRole,
  content: string,
  id: string = crypto.randomUUID(),
  metadata?: AssistantResponseMetadata,
): ChatMessage {
  return {
    id,
    timestamp: Date.now(),
    role,
    content,
    metadata,
  }
}

function getRecentHistory(messages: ChatMessage[]): AskDocumentHistoryMessage[] {
  return messages
    .filter(
      (message): message is ChatMessage & { role: 'user' | 'assistant' } =>
        message.role === 'user' || message.role === 'assistant',
    )
    .slice(-ASK_DOCUMENT_HISTORY_LIMIT)
    .map(({ role, content }) => ({ role, content }))
}

function getFriendlyError(error: unknown): ConversationError {
  if (error instanceof AskDocumentServiceError) {
    return { message: error.message, canRetry: true }
  }

  return {
    message: 'The document assistant encountered an unexpected error. Please try again.',
    canRetry: true,
  }
}

export function useAskDocumentConversation(getKnowledgeContext: () => KnowledgeContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ConversationError | null>(null)
  const requestRef = useRef<AbortController | null>(null)
  const failedRequestRef = useRef<PendingRequest | null>(null)
  const completedRequestRef = useRef<CompletedRequest | null>(null)

  const runRequest = useCallback(
    async (pendingRequest: PendingRequest, replaceMessageId?: string) => {
      if (requestRef.current) return

      const { context } = pendingRequest
      failedRequestRef.current = pendingRequest
      setError(null)

      if (!context.currentDocument.trim() && context.activeKnowledgeSources.length === 0) {
        setError({
          message: 'Add content to the current document or activate a readable knowledge source.',
          canRetry: true,
        })
        return
      }

      const request = new AbortController()
      const assistantMessageId = replaceMessageId ?? crypto.randomUUID()
      const startedAt = performance.now()
      let responseMetadata: AskDocumentResponseMetadata | null = null
      const streamBuffer = createFrameStreamBuffer((content) => {
        const metadata = responseMetadata
        if (!metadata) return

        setMessages((current) => {
          const assistantMessage = current.find(
            (message) => message.id === assistantMessageId,
          )

          if (!assistantMessage) {
            return [
              ...current,
              createMessage('assistant', content, assistantMessageId, metadata),
            ]
          }

          return current.map((message) =>
            message.id === assistantMessageId
              ? { ...message, content: message.content + content }
              : message,
          )
        })
      })
      requestRef.current = request
      setIsLoading(true)
      if (replaceMessageId) {
        setMessages((current) =>
          current.filter((message) => message.id !== replaceMessageId),
        )
      }

      try {
        await streamAskDocument(
          buildAskDocumentRequest(context, pendingRequest.history, pendingRequest.question),
          streamBuffer.push,
          (metadata) => {
            responseMetadata = metadata
          },
          request.signal,
        )
        streamBuffer.flush()
        const responseTime = Math.max(0, Math.round(performance.now() - startedAt))
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessageId && message.metadata
              ? {
                  ...message,
                  metadata: {
                    ...message.metadata,
                    responseTime,
                  },
                }
              : message,
          ),
        )
        failedRequestRef.current = null
        completedRequestRef.current = {
          messageId: assistantMessageId,
          request: pendingRequest,
        }
      } catch (reason) {
        streamBuffer.cancel()
        if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
          setMessages((current) =>
            current.filter((message) => message.id !== assistantMessageId),
          )
          setError(getFriendlyError(reason))
        }
      } finally {
        if (requestRef.current === request) {
          requestRef.current = null
          setIsLoading(false)
        }
      }
    },
    [],
  )

  const sendMessage = useCallback(
    (content: string) => {
      const question = content.trim()
      if (!question || requestRef.current) return false

      const pendingRequest: PendingRequest = {
        question,
        history: getRecentHistory(messages),
        context: getKnowledgeContext(),
      }
      setMessages((current) => [...current, createMessage('user', question)])
      void runRequest(pendingRequest)
      return true
    },
    [getKnowledgeContext, messages, runRequest],
  )

  const retryLastMessage = useCallback(() => {
    const pendingRequest = failedRequestRef.current
    if (pendingRequest) void runRequest(pendingRequest)
  }, [runRequest])

  const regenerateMessage = useCallback(
    (messageId: string) => {
      const completedRequest = completedRequestRef.current
      if (completedRequest?.messageId === messageId) {
        void runRequest(completedRequest.request, messageId)
      }
    },
    [runRequest],
  )

  const clearConversation = useCallback(() => {
    requestRef.current?.abort()
    requestRef.current = null
    failedRequestRef.current = null
    completedRequestRef.current = null
    setMessages([])
    setError(null)
    setIsLoading(false)
  }, [])

  const cancelRequest = useCallback(() => {
    requestRef.current?.abort()
  }, [])

  useEffect(
    () => () => {
      requestRef.current?.abort()
    },
    [],
  )

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    retryLastMessage,
    regenerateMessage,
    regeneratableMessageId: completedRequestRef.current?.messageId ?? null,
    cancelRequest,
    clearConversation,
  }
}
