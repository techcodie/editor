import type { ServerResponse } from 'node:http'
import type { AiStreamEvent } from '../shared/ai.js'
import type { AskDocumentResponseMetadata } from '../shared/ask-document.js'
import {
  ProviderError,
  streamAiCompletion,
  type ChatMessage,
} from './providers/index.js'
import { sendJsonError } from './http.js'

interface AiResponseMessages {
  configuration: string
  rateLimit: string
  upstream: string
  invalid: string
  unexpected: string
}

function sendEvent(response: ServerResponse, event: AiStreamEvent): void {
  response.write(`data: ${JSON.stringify(event)}\n\n`)
}

const KEEP_ALIVE_INTERVAL_MS = 15_000

/**
 * A bare SSE comment line, sent periodically while the upstream provider
 * stream is open. A response that pauses between tokens for longer than an
 * intermediary proxy/load balancer's idle-connection timeout (a real risk
 * for a slower model on a long answer) would otherwise have the connection
 * silently dropped mid-stream with no event ever telling the client why.
 * The client (`src/services/ai-stream.ts`) already tolerates any frame with
 * no `data:` line as a no-op, so this never surfaces as content.
 */
function startKeepAlive(response: ServerResponse): () => void {
  const timer = setInterval(() => {
    if (!response.writableEnded) response.write(': keep-alive\n\n')
  }, KEEP_ALIVE_INTERVAL_MS)
  return () => clearInterval(timer)
}

function getProviderError(
  error: ProviderError,
  messages: AiResponseMessages,
): { status: number; message: string } {
  switch (error.kind) {
    case 'configuration':
      return { status: 503, message: messages.configuration }
    case 'rate_limit':
      return { status: 429, message: messages.rateLimit }
    case 'invalid_response':
      return { status: 502, message: messages.invalid }
    case 'upstream':
      return { status: 502, message: messages.upstream }
  }
}

export async function sendAiResponse(
  response: ServerResponse,
  messages: ChatMessage[],
  errorMessages: AiResponseMessages,
  signal: AbortSignal,
  metadata?: AskDocumentResponseMetadata,
): Promise<void> {
  try {
    const stream = streamAiCompletion(messages, signal)
    const first = await stream.next()
    if (first.done || !first.value) {
      throw new ProviderError('invalid_response', 'The AI provider returned an empty response.')
    }

    response.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'X-Content-Type-Options': 'nosniff',
    })
    const stopKeepAlive = startKeepAlive(response)
    try {
      if (metadata) sendEvent(response, { type: 'metadata', metadata })
      sendEvent(response, { type: 'delta', content: first.value })

      for await (const content of stream) {
        sendEvent(response, { type: 'delta', content })
      }

      sendEvent(response, { type: 'done' })
    } finally {
      stopKeepAlive()
    }
    response.end()
  } catch (error) {
    if (signal.aborted) return

    const providerError =
      error instanceof ProviderError
        ? getProviderError(error, errorMessages)
        : { status: 500, message: errorMessages.unexpected }

    if (!(error instanceof ProviderError)) {
      console.error('AI response stream failed', error)
    }

    if (!response.headersSent) {
      sendJsonError(response, providerError.status, providerError.message)
    } else {
      sendEvent(response, { type: 'error', message: providerError.message })
      response.end()
    }
  }
}
