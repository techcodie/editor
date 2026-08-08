import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleAskDocument } from './ask-document.js'
import { handleSelectionAi } from './selection-ai.js'
import { handleComplianceAnalysis } from './compliance.js'
import { handleContractAnalysis } from './contract.js'
import { handleWritingAssistant } from './writing.js'
import {
  applyCors,
  applySecurityHeaders,
  handleRequestError,
  sendJsonError,
} from './http.js'
import { createAiRateLimiter } from './rate-limit.js'
import { isAiProviderConfigured } from './providers/index.js'

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)), '..')
const clientDirectory = resolve(projectRoot, 'dist')

function loadLocalEnvironment(): void {
  const environmentPath = resolve(projectRoot, '.env')
  if (existsSync(environmentPath)) process.loadEnvFile(environmentPath)
}

function sendNotFound(response: ServerResponse): void {
  sendJsonError(response, 404, 'Not found.')
}

function sendJson(
  response: ServerResponse,
  status: number,
  body: Record<string, unknown>,
): void {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  response.end(JSON.stringify(body))
}

function isImmutableAsset(filePath: string): boolean {
  return filePath.startsWith(resolve(clientDirectory, 'assets') + sep)
}

async function serveClient(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://localhost')
  let pathname: string

  try {
    pathname = decodeURIComponent(url.pathname)
  } catch {
    sendNotFound(response)
    return
  }

  const requestedPath = pathname === '/' ? 'index.html' : pathname.slice(1)
  const filePath = resolve(clientDirectory, requestedPath)
  if (filePath !== clientDirectory && !filePath.startsWith(`${clientDirectory}${sep}`)) {
    sendNotFound(response)
    return
  }

  try {
    const content = await readFile(filePath)
    response.writeHead(200, {
      'Content-Type': MIME_TYPES[extname(filePath)] ?? 'application/octet-stream',
      'Cache-Control': filePath.endsWith('index.html')
        ? 'no-cache'
        : isImmutableAsset(filePath)
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=3600',
    })
    response.end(request.method === 'HEAD' ? undefined : content)
  } catch {
    if (extname(requestedPath)) {
      sendNotFound(response)
      return
    }

    try {
      const content = await readFile(resolve(clientDirectory, 'index.html'))
      response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      })
      response.end(request.method === 'HEAD' ? undefined : content)
    } catch {
      sendNotFound(response)
    }
  }
}

loadLocalEnvironment()

const consumeAiRateLimit = createAiRateLimiter()
const AI_PATHS = new Set([
  '/api/ask-document',
  '/api/selection-ai',
  '/api/compliance-analysis',
  '/api/contract-analysis',
  '/api/writing-assistant',
])

async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  applySecurityHeaders(response)
  const url = new URL(request.url ?? '/', 'http://localhost')

  if (url.pathname.startsWith('/api/') && !applyCors(request, response)) return
  if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
    response.writeHead(204, { 'Cache-Control': 'no-store' })
    response.end()
    return
  }
  if (request.method === 'GET' && url.pathname === '/api/health') {
    sendJson(response, 200, { status: 'ok' })
    return
  }
  if (request.method === 'GET' && url.pathname === '/api/ready') {
    const ready = isAiProviderConfigured()
    sendJson(response, ready ? 200 : 503, {
      status: ready ? 'ready' : 'not_ready',
      provider: ready ? 'configured' : 'missing',
    })
    return
  }

  if (request.method === 'POST' && AI_PATHS.has(url.pathname) && !consumeAiRateLimit(request, response)) {
    sendJsonError(response, 429, 'Too many AI requests. Wait briefly and try again.')
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/ask-document') {
    await handleAskDocument(request, response)
    return
  }
  if (request.method === 'POST' && url.pathname === '/api/selection-ai') {
    await handleSelectionAi(request, response)
    return
  }
  if (request.method === 'POST' && url.pathname === '/api/compliance-analysis') {
    await handleComplianceAnalysis(request, response)
    return
  }
  if (request.method === 'POST' && url.pathname === '/api/contract-analysis') {
    await handleContractAnalysis(request, response)
    return
  }
  if (request.method === 'POST' && url.pathname === '/api/writing-assistant') {
    await handleWritingAssistant(request, response)
    return
  }
  if (url.pathname.startsWith('/api/')) {
    if (AI_PATHS.has(url.pathname)) {
      response.setHeader('Allow', 'POST, OPTIONS')
      sendJsonError(response, 405, 'Method not allowed.')
      return
    }
    sendNotFound(response)
    return
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD, POST, OPTIONS' })
    response.end()
    return
  }

  await serveClient(request, response)
}

const server = createServer((request, response) => {
  void handleRequest(request, response).catch((error: unknown) => {
    if (response.headersSent) {
      response.destroy()
      return
    }
    handleRequestError(
      response,
      error,
      'Unhandled server',
      'The server could not complete this request.',
    )
  })
})

const port = Number(process.env.AI_SERVER_PORT ?? process.env.PORT ?? 3001)
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('AI_SERVER_PORT or PORT must be a valid TCP port.')
}

// Bind all interfaces by default: cloud load balancers (Render, Fly, Docker,
// ...) connect from outside the container and cannot reach a loopback-only
// bind. Override with HOST for a deliberately loopback-restricted local run.
const host = process.env.HOST?.trim() || '0.0.0.0'

server.requestTimeout = 125_000
server.headersTimeout = 130_000
server.keepAliveTimeout = 5_000

server.on('clientError', (_error, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n')
})

server.listen(port, host, () => {
  console.log(`Document editor server listening on http://${host}:${port}`)
})

function shutdown(signal: string): void {
  console.log(`Received ${signal}; closing the document editor server.`)
  server.close((error) => {
    if (error) {
      console.error('Document editor server shutdown failed', error)
      process.exitCode = 1
    }
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.once('SIGTERM', () => shutdown('SIGTERM'))
process.once('SIGINT', () => shutdown('SIGINT'))
