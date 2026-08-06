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

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)), '..')
const clientDirectory = resolve(projectRoot, 'dist')

function loadLocalEnvironment(): void {
  const environmentPath = resolve(projectRoot, '.env')
  if (existsSync(environmentPath)) process.loadEnvFile(environmentPath)
}

function sendNotFound(response: ServerResponse): void {
  response.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify({ error: 'Not found.' }))
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
      'Cache-Control': filePath.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
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
        'X-Content-Type-Options': 'nosniff',
      })
      response.end(request.method === 'HEAD' ? undefined : content)
    } catch {
      sendNotFound(response)
    }
  }
}

loadLocalEnvironment()

// Comma-separated allowlist for cross-origin frontend deployments (e.g. Vercel).
// Unset means "allow any origin" — safe here because every endpoint is a
// stateless JSON/SSE proxy with a server-only API key and no cookies/sessions.
const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

function resolveAllowedOrigin(requestOrigin: string | undefined): string | null {
  if (ALLOWED_ORIGINS.length === 0) return '*'
  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin
  return null
}

function applyCorsHeaders(request: IncomingMessage, response: ServerResponse): void {
  const allowOrigin = resolveAllowedOrigin(request.headers.origin)
  if (!allowOrigin) return
  response.setHeader('Access-Control-Allow-Origin', allowOrigin)
  if (allowOrigin !== '*') response.setHeader('Vary', 'Origin')
  response.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  response.setHeader('Access-Control-Max-Age', '86400')
}

function sendHealth(response: ServerResponse, method: string | undefined): void {
  response.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  response.end(method === 'HEAD' ? undefined : JSON.stringify({ status: 'ok' }))
}

const server = createServer(async (request, response) => {
  applyCorsHeaders(request, response)

  if (request.method === 'OPTIONS') {
    response.writeHead(204)
    response.end()
    return
  }

  const url = new URL(request.url ?? '/', 'http://localhost')

  // Render (and most PaaS load balancers) poll this path to confirm the
  // service is live; it must succeed before `dist/` is necessarily present.
  if ((url.pathname === '/healthz' || url.pathname === '/health') && (request.method === 'GET' || request.method === 'HEAD')) {
    sendHealth(response, request.method)
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
    sendNotFound(response)
    return
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD, POST, OPTIONS' })
    response.end()
    return
  }

  await serveClient(request, response)
})

const port = Number(process.env.AI_SERVER_PORT ?? process.env.PORT ?? 3001)
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('AI_SERVER_PORT or PORT must be a valid TCP port.')
}

// Bind all interfaces by default: cloud load balancers (Render, Fly, Docker,
// ...) connect from outside the container and cannot reach a loopback-only
// bind. Override with HOST for a deliberately loopback-restricted local run.
const host = process.env.HOST?.trim() || '0.0.0.0'

server.listen(port, host, () => {
  console.log(`Document editor server listening on http://${host}:${port}`)
})

function shutdown(signal: string): void {
  console.log(`${signal} received, closing server gracefully...`)
  server.close((error) => {
    if (error) {
      console.error('Error while closing the server.', error)
      process.exitCode = 1
    }
    process.exit()
  })
  // In-flight SSE streams can hold the server open indefinitely; force exit
  // if graceful close hasn't finished shortly after the shutdown signal.
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
