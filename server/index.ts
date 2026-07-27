import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleAskDocument } from './ask-document.js'
import { handleSelectionAi } from './selection-ai.js'
import { handleComplianceAnalysis } from './compliance.js'

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

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost')

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
  if (url.pathname.startsWith('/api/')) {
    sendNotFound(response)
    return
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD, POST' })
    response.end()
    return
  }

  await serveClient(request, response)
})

const port = Number(process.env.AI_SERVER_PORT ?? process.env.PORT ?? 3001)
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('AI_SERVER_PORT or PORT must be a valid TCP port.')
}

const host = process.env.HOST?.trim() || '127.0.0.1'

server.listen(port, host, () => {
  console.log(`Document editor server listening on http://${host}:${port}`)
})
