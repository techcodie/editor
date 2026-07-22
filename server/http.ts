import type { IncomingMessage, ServerResponse } from 'node:http'
import type { AiErrorResponse } from '../shared/ai.js'

const MAX_BODY_BYTES = 256 * 1024

export class RequestValidationError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function requireJson(request: IncomingMessage): void {
  if (!request.headers['content-type']?.includes('application/json')) {
    throw new RequestValidationError(415, 'The request must use JSON.')
  }
}

export function readJson(request: IncomingMessage): Promise<unknown> {
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

export function createRequestAbortController(response: ServerResponse): AbortController {
  const abortController = new AbortController()
  response.on('close', () => {
    if (!response.writableEnded) abortController.abort()
  })
  return abortController
}

export function sendJsonError(response: ServerResponse, status: number, message: string): void {
  const body: AiErrorResponse = { error: message }
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  response.end(JSON.stringify(body))
}

export function handleRequestError(
  response: ServerResponse,
  error: unknown,
  context: string,
  fallbackMessage: string,
): void {
  if (error instanceof RequestValidationError) {
    sendJsonError(response, error.status, error.message)
    return
  }

  console.error(`${context} request failed`, error)
  sendJsonError(response, 500, fallbackMessage)
}
