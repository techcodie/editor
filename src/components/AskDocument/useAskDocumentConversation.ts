import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ASK_DOCUMENT_HISTORY_LIMIT,
  type AskDocumentHistoryMessage,
} from '../../../shared/ask-document'
import { AskDocumentServiceError, streamAskDocument } from '../../services/ask-document'
import type { ChatMessage, ChatRole, ConversationError } from './types'

interface PendingRequest {
  question: string
  history: AskDocumentHistoryMessage[]
}

function createMessage(role: ChatRole, content: string, id = crypto.randomUUID()): ChatMessage {
  return {
    id,
    timestamp: Date.now(),
    role,
    content,
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

export function useAskDocumentConversation(getDocumentText: () => string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ConversationError | null>(null)
  const requestRef = useRef<AbortController | null>(null)
  const lastRequestRef = useRef<PendingRequest | null>(null)

  const runRequest = useCallback(
    async (pendingRequest: PendingRequest) => {
      if (requestRef.current) return

      const document = getDocumentText().trim()
      lastRequestRef.current = pendingRequest
      setError(null)

      if (!document) {
        setError({
          message: 'Add some content to the document before asking a question.',
          canRetry: true,
        })
        return
      }

      const request = new AbortController()
      const assistantMessageId = crypto.randomUUID()
      requestRef.current = request
      setIsLoading(true)

      try {
        await streamAskDocument(
          {
            document,
            question: pendingRequest.question,
            history: pendingRequest.history,
          },
          (content) => {
            setMessages((current) => {
              const assistantMessage = current.find(
                (message) => message.id === assistantMessageId,
              )

              if (!assistantMessage) {
                return [...current, createMessage('assistant', content, assistantMessageId)]
              }

              return current.map((message) =>
                message.id === assistantMessageId
                  ? { ...message, content: message.content + content }
                  : message,
              )
            })
          },
          request.signal,
        )
        lastRequestRef.current = null
      } catch (reason) {
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
    [getDocumentText],
  )

  const sendMessage = useCallback(
    (content: string) => {
      const question = content.trim()
      if (!question || requestRef.current) return

      const pendingRequest: PendingRequest = {
        question,
        history: getRecentHistory(messages),
      }
      setMessages((current) => [...current, createMessage('user', question)])
      void runRequest(pendingRequest)
    },
    [messages, runRequest],
  )

  const retryLastMessage = useCallback(() => {
    const pendingRequest = lastRequestRef.current
    if (pendingRequest) void runRequest(pendingRequest)
  }, [runRequest])

  const clearConversation = useCallback(() => {
    requestRef.current?.abort()
    requestRef.current = null
    lastRequestRef.current = null
    setMessages([])
    setError(null)
    setIsLoading(false)
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
    clearConversation,
  }
}
