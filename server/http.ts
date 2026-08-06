import type { IncomingMessage, ServerResponse } from 'node:http'
import type { AiErrorResponse } from '../shared/ai.js'

const MAX_BODY_BYTES = 256 * 1024

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "worker-src 'self' blob:",
  "media-src 'self' data: blob:",
  "form-action 'self'",
].join('; ')

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

export function applySecurityHeaders(response: ServerResponse): void {
  response.setHeader('Content-Security-Policy', CONTENT_SECURITY_POLICY)
  response.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=(self)')
  response.setHeader('Referrer-Policy', 'no-referrer')
  response.setHeader('Strict-Transport-Security', 'max-age=31536000')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('X-Permitted-Cross-Domain-Policies', 'none')
}

function appendVary(response: ServerResponse, value: string): void {
  const current = response.getHeader('Vary')
  const values = new Set(
    (Array.isArray(current) ? current : String(current ?? '').split(','))
      .map((item) => item.trim())
      .filter(Boolean),
  )
  values.add(value)
  response.setHeader('Vary', [...values].join(', '))
}

function allowedOrigins(): Set<string> {
  return new Set(
    (process.env.CORS_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter((origin) => /^https?:\/\/[^/]+$/i.test(origin)),
  )
}

export function applyCors(request: IncomingMessage, response: ServerResponse): boolean {
  const origin = request.headers.origin?.replace(/\/$/, '')
  if (!origin) return true

  const configuredOrigins = allowedOrigins()
  if (configuredOrigins.size === 0) return true
  appendVary(response, 'Origin')
  if (!configuredOrigins.has(origin)) {
    sendJsonError(response, 403, 'This origin is not allowed.')
    return false
  }

  response.setHeader('Access-Control-Allow-Origin', origin)
  response.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  response.setHeader('Access-Control-Max-Age', '600')
  return true
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

    const contentLength = Number(request.headers['content-length'])
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      request.resume()
      reject(new RequestValidationError(413, 'The request is too large.'))
      return
    }

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
    request.on('aborted', () => reject(new Error('The request was aborted.')))
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
