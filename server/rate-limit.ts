import type { IncomingMessage, ServerResponse } from 'node:http'

interface RateLimitEntry {
  count: number
  resetAt: number
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function clientAddress(request: IncomingMessage): string {
  if (process.env.TRUST_PROXY === 'true') {
    const forwarded = request.headers['x-forwarded-for']
    const value = Array.isArray(forwarded) ? forwarded[0] : forwarded
    const address = value?.split(',')[0]?.trim()
    if (address) return address.slice(0, 128)
  }
  return request.socket.remoteAddress?.slice(0, 128) || 'unknown'
}

export function createAiRateLimiter() {
  const limit = positiveInteger(process.env.RATE_LIMIT_REQUESTS, 30)
  const windowMs = positiveInteger(process.env.RATE_LIMIT_WINDOW_MS, 60_000)
  const entries = new Map<string, RateLimitEntry>()

  return (request: IncomingMessage, response: ServerResponse): boolean => {
    const now = Date.now()
    const key = clientAddress(request)
    const current = entries.get(key)
    const entry = !current || current.resetAt <= now
      ? { count: 1, resetAt: now + windowMs }
      : { count: current.count + 1, resetAt: current.resetAt }
    entries.set(key, entry)

    if (entries.size > 5_000) {
      for (const [candidate, value] of entries) {
        if (value.resetAt <= now) entries.delete(candidate)
      }
      while (entries.size > 5_000) {
        const oldest = entries.keys().next().value
        if (oldest === undefined) break
        entries.delete(oldest)
      }
    }

    const remaining = Math.max(0, limit - entry.count)
    const resetSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1_000))
    response.setHeader('RateLimit-Limit', String(limit))
    response.setHeader('RateLimit-Remaining', String(remaining))
    response.setHeader('RateLimit-Reset', String(resetSeconds))
    if (entry.count <= limit) return true

    response.setHeader('Retry-After', String(resetSeconds))
    return false
  }
}
