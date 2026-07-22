import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessage, ChatRole } from './types'

const MOCK_RESPONSE_DELAY = 850
const MOCK_RESPONSE =
  'This is a placeholder response. AI integration will be added in the next milestone.'

function createMessage(role: ChatRole, content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    role,
    content,
  }
}

function waitForMockResponse(signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => resolve(MOCK_RESPONSE), MOCK_RESPONSE_DELAY)

    signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timeoutId)
        reject(new DOMException('The response was cancelled.', 'AbortError'))
      },
      { once: true },
    )
  })
}

export function useAskDocumentConversation() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestRef = useRef<AbortController | null>(null)

  const addMessage = useCallback((role: ChatRole, content: string) => {
    setMessages((current) => [...current, createMessage(role, content)])
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      const question = content.trim()
      if (!question || requestRef.current) return

      addMessage('user', question)
      setError(null)
      setIsLoading(true)

      const request = new AbortController()
      requestRef.current = request

      try {
        const response = await waitForMockResponse(request.signal)
        addMessage('assistant', response)
      } catch (reason) {
        if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
          setError('The response could not be created. Please try again.')
        }
      } finally {
        if (requestRef.current === request) {
          requestRef.current = null
          setIsLoading(false)
        }
      }
    },
    [addMessage],
  )

  const clearConversation = useCallback(() => {
    requestRef.current?.abort()
    requestRef.current = null
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
    clearConversation,
  }
}
