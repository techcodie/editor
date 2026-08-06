import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'

const host = '127.0.0.1'
const allowedOrigin = 'https://editor.example.test'

async function availablePort() {
  const server = createServer()
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, host, resolve)
  })
  const address = server.address()
  assert(address && typeof address === 'object')
  const port = address.port
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  return port
}

async function waitForServer(baseUrl, child) {
  const deadline = Date.now() + 8_000
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Server exited with code ${child.exitCode}.`)
    try {
      const response = await fetch(`${baseUrl}/api/health`)
      if (response.ok) return
    } catch {
      // The server may still be binding its socket.
    }
    await new Promise((resolve) => setTimeout(resolve, 80))
  }
  throw new Error('Server did not become healthy within 8 seconds.')
}

const port = await availablePort()
const baseUrl = `http://${host}:${port}`
const child = spawn(process.execPath, ['dist-server/server/index.js'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    AI_SERVER_PORT: String(port),
    HOST: host,
    CORS_ORIGINS: allowedOrigin,
    GROQ_API_KEY: '',
    RATE_LIMIT_REQUESTS: '2',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
})

let stderr = ''
child.stderr.setEncoding('utf8')
child.stderr.on('data', (chunk) => { stderr += chunk })

try {
  await waitForServer(baseUrl, child)

  const health = await fetch(`${baseUrl}/api/health`)
  assert.equal(health.status, 200)
  assert.deepEqual(await health.json(), { status: 'ok' })
  assert.equal(health.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(health.headers.get('strict-transport-security'), 'max-age=31536000')
  assert.match(health.headers.get('content-security-policy') ?? '', /object-src 'none'/)

  const readiness = await fetch(`${baseUrl}/api/ready`)
  assert.equal(readiness.status, 503)
  assert.deepEqual(await readiness.json(), {
    status: 'not_ready',
    provider: 'missing',
  })

  const preflight = await fetch(`${baseUrl}/api/ask-document`, {
    method: 'OPTIONS',
    headers: { Origin: allowedOrigin },
  })
  assert.equal(preflight.status, 204)
  assert.equal(preflight.headers.get('access-control-allow-origin'), allowedOrigin)

  const deniedOrigin = await fetch(`${baseUrl}/api/ask-document`, {
    method: 'POST',
    headers: { Origin: 'https://untrusted.example.test', 'Content-Type': 'application/json' },
    body: '{}',
  })
  assert.equal(deniedOrigin.status, 403)

  const invalidType = await fetch(`${baseUrl}/api/selection-ai`, {
    method: 'POST',
    headers: { Origin: allowedOrigin, 'Content-Type': 'text/plain' },
    body: 'invalid',
  })
  assert.equal(invalidType.status, 415)

  const invalidMethod = await fetch(`${baseUrl}/api/selection-ai`, {
    headers: { Origin: allowedOrigin },
  })
  assert.equal(invalidMethod.status, 405)
  assert.equal(invalidMethod.headers.get('allow'), 'POST, OPTIONS')

  const invalidPayload = await fetch(`${baseUrl}/api/selection-ai`, {
    method: 'POST',
    headers: { Origin: allowedOrigin, 'Content-Type': 'application/json' },
    body: '{}',
  })
  assert.equal(invalidPayload.status, 400)

  const rateLimited = await fetch(`${baseUrl}/api/selection-ai`, {
    method: 'POST',
    headers: { Origin: allowedOrigin, 'Content-Type': 'application/json' },
    body: '{}',
  })
  assert.equal(rateLimited.status, 429)
  assert.equal(rateLimited.headers.get('ratelimit-remaining'), '0')
  assert.ok(Number(rateLimited.headers.get('retry-after')) >= 1)

  const missing = await fetch(`${baseUrl}/api/not-found`)
  assert.equal(missing.status, 404)

  console.log('Server smoke verification passed.')
} finally {
  child.kill('SIGTERM')
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Server did not stop.')), 5_000)),
  ]).catch((error) => {
    child.kill('SIGKILL')
    throw error
  })
  if (stderr.trim()) process.stderr.write(stderr)
}
