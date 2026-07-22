import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  ASK_DOCUMENT_HISTORY_LIMIT,
  type AskDocumentErrorResponse,
  type AskDocumentHistoryMessage,
  type AskDocumentRequest,
  type AskDocumentStreamEvent,
} from '../shared/ask-document.js'
import { buildDocumentQuestionPrompt, ASK_DOCUMENT_SYSTEM_PROMPT } from './prompts.js'
import { GroqProviderError, streamGroqCompletion } from './providers/groq.js'

const MAX_BODY_BYTES = 256 * 1024
const MAX_DOCUMENT_CHARS = 80_000
const MAX_QUESTION_CHARS = 2_000
const MAX_HISTORY_MESSAGE_CHARS = 4_000

class RequestValidationError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseHistory(value: unknown): AskDocumentHistoryMessage[] {
  if (!Array.isArray(value)) throw new RequestValidationError(400, 'Conversation history is invalid.')

  return value.slice(-ASK_DOCUMENT_HISTORY_LIMIT).map((message) => {
    if (!isRecord(message)) throw new RequestValidationError(400, 'Conversation history is invalid.')

    const role = message.role
    const content = typeof message.content === 'string' ? message.content.trim() : ''
    if ((role !== 'user' && role !== 'assistant') || !content) {
      throw new RequestValidationError(400, 'Conversation history is invalid.')
    }
    if (content.length > MAX_HISTORY_MESSAGE_CHARS) {
      throw new RequestValidationError(413, 'A conversation message is too long.')
    }

    return { role, content }
  })
}

function validateRequest(value: unknown): AskDocumentRequest {
  if (!isRecord(value)) throw new RequestValidationError(400, 'The request is invalid.')

  const document = typeof value.document === 'string' ? value.document.trim() : ''
  const question = typeof value.question === 'string' ? value.question.trim() : ''

  if (!document) throw new RequestValidationError(400, 'Add some content to the document first.')
  if (!question) throw new RequestValidationError(400, 'Enter a question about the document.')
  if (document.length > MAX_DOCUMENT_CHARS) {
    throw new RequestValidationError(413, 'The current document is too long to analyze safely.')
  }
  if (question.length > MAX_QUESTION_CHARS) {
    throw new RequestValidationError(413, 'The question is too long. Please make it shorter.')
  }

  return { document, question, history: parseHistory(value.history) }
}

function readJson(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    let tooLarge = false

    request.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        tooLarge = true
        chunks.length = 0
      } else if (!tooLarge) {
        chunks.push(chunk)
      }
    })
    request.on('end', () => {
      if (tooLarge) {
        reject(new RequestValidationError(413, 'The request is too large.'))
        return
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(new RequestValidationError(400, 'The request body must be valid JSON.'))
      }
    })
    request.on('error', reject)
  })
}

function sendJsonError(response: ServerResponse, status: number, message: string): void {
  const body: AskDocumentErrorResponse = { error: message }
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  response.end(JSON.stringify(body))
}

function sendEvent(response: ServerResponse, event: AskDocumentStreamEvent): void {
  response.write(`data: ${JSON.stringify(event)}\n\n`)
}

function getProviderError(error: GroqProviderError): { status: number; message: string } {
  switch (error.kind) {
    case 'configuration':
      return { status: 503, message: 'The document assistant is not configured yet.' }
    case 'rate_limit':
      return { status: 429, message: 'The document assistant is busy. Please try again shortly.' }
    case 'invalid_response':
      return { status: 502, message: 'The document assistant returned an invalid response.' }
    case 'upstream':
      return { status: 502, message: 'The document assistant is temporarily unavailable.' }
  }
}

export async function handleAskDocument(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  if (!request.headers['content-type']?.includes('application/json')) {
    sendJsonError(response, 415, 'The request must use JSON.')
    return
  }

  const abortController = new AbortController()
  response.on('close', () => {
    if (!response.writableEnded) abortController.abort()
  })

  try {
    const body = validateRequest(await readJson(request))
    const messages = [
      { role: 'system' as const, content: ASK_DOCUMENT_SYSTEM_PROMPT },
      ...body.history,
      {
        role: 'user' as const,
        content: buildDocumentQuestionPrompt(body.document, body.question),
      },
    ]

    const stream = streamGroqCompletion(messages, abortController.signal)
    const first = await stream.next()
    if (first.done || !first.value) {
      throw new GroqProviderError('invalid_response', 'Groq returned an empty response.')
    }

    response.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'X-Content-Type-Options': 'nosniff',
    })
    sendEvent(response, { type: 'delta', content: first.value })

    for await (const content of stream) {
      sendEvent(response, { type: 'delta', content })
    }

    sendEvent(response, { type: 'done' })
    response.end()
  } catch (error) {
    if (abortController.signal.aborted) return

    if (error instanceof RequestValidationError) {
      sendJsonError(response, error.status, error.message)
      return
    }
    if (error instanceof GroqProviderError) {
      const providerError = getProviderError(error)
      if (!response.headersSent) {
        sendJsonError(response, providerError.status, providerError.message)
      } else {
        sendEvent(response, { type: 'error', message: providerError.message })
        response.end()
      }
      return
    }

    console.error('Ask Document request failed', error)
    if (!response.headersSent) {
      sendJsonError(response, 500, 'The document assistant encountered an unexpected error.')
    } else {
      sendEvent(response, {
        type: 'error',
        message: 'The document assistant encountered an unexpected error.',
      })
      response.end()
    }
  }
}
