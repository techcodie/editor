const DEFAULT_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'llama-3.1-8b-instant'
const DEFAULT_TIMEOUT_MS = 30_000

export function getGroqModel(): string {
  return process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL
}

export interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GroqStreamChunk {
  choices?: Array<{
    delta?: { content?: string | null }
  }>
}

export type GroqErrorKind = 'configuration' | 'rate_limit' | 'upstream' | 'invalid_response'

export class GroqProviderError extends Error {
  constructor(
    readonly kind: GroqErrorKind,
    message: string,
  ) {
    super(message)
    this.name = 'GroqProviderError'
  }
}

function parseChunk(data: string): string | null {
  let chunk: GroqStreamChunk

  try {
    chunk = JSON.parse(data) as GroqStreamChunk
  } catch {
    throw new GroqProviderError('invalid_response', 'Groq returned malformed stream data.')
  }

  const content = chunk.choices?.[0]?.delta?.content
  if (content == null) return null
  if (typeof content !== 'string') {
    throw new GroqProviderError('invalid_response', 'Groq returned an invalid content delta.')
  }

  return content
}

function getApiUrl(): string {
  const configured = process.env.GROQ_API_URL?.trim() || DEFAULT_API_URL
  let url: URL
  try {
    url = new URL(configured)
  } catch {
    throw new GroqProviderError('configuration', 'GROQ_API_URL is invalid.')
  }
  if (url.protocol !== 'https:') {
    throw new GroqProviderError('configuration', 'GROQ_API_URL must use HTTPS.')
  }
  return url.toString()
}

function getTimeoutMs(): number {
  const configured = Number(process.env.GROQ_TIMEOUT_MS)
  return Number.isInteger(configured) && configured >= 1_000 && configured <= 120_000
    ? configured
    : DEFAULT_TIMEOUT_MS
}

export async function* streamGroqCompletion(
  messages: GroqChatMessage[],
  signal: AbortSignal,
): AsyncGenerator<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim()
  if (!apiKey) {
    throw new GroqProviderError('configuration', 'GROQ_API_KEY is not configured.')
  }

  let response: Response
  const providerController = new AbortController()
  const handleAbort = () => providerController.abort(signal.reason)
  const timeout = setTimeout(
    () => providerController.abort(new DOMException('Groq request timed out.', 'TimeoutError')),
    getTimeoutMs(),
  )
  const cleanup = () => {
    clearTimeout(timeout)
    signal.removeEventListener('abort', handleAbort)
  }
  signal.addEventListener('abort', handleAbort, { once: true })
  try {
    response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: getGroqModel(),
        messages,
        stream: true,
        temperature: 0.1,
        max_completion_tokens: 1200,
      }),
      signal: providerController.signal,
    })
  } catch {
    cleanup()
    if (signal.aborted) throw new DOMException('AI request cancelled.', 'AbortError')
    throw new GroqProviderError('upstream', 'Groq could not be reached.')
  }

  if (!response.ok) {
    cleanup()
    const kind: GroqErrorKind = response.status === 429 ? 'rate_limit' : 'upstream'
    throw new GroqProviderError(kind, `Groq request failed with status ${response.status}.`)
  }
  if (!response.body) {
    cleanup()
    throw new GroqProviderError('invalid_response', 'Groq returned no response body.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let receivedDone = false

  try {
    while (true) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value, { stream: !done }).replaceAll('\r\n', '\n')

      const frames = buffer.split('\n\n')
      buffer = done ? '' : (frames.pop() ?? '')

      for (const frame of frames) {
        for (const line of frame.split('\n')) {
          if (!line.startsWith('data:')) continue
          const data = line.slice(5).trim()
          if (!data) continue
          if (data === '[DONE]') {
            receivedDone = true
            continue
          }

          const content = parseChunk(data)
          if (content) yield content
        }
      }

      if (done) break
    }
  } catch (error) {
    if (signal.aborted) throw new DOMException('AI request cancelled.', 'AbortError')
    if (providerController.signal.aborted) {
      throw new GroqProviderError('upstream', 'Groq response timed out.')
    }
    throw error
  } finally {
    cleanup()
    reader.releaseLock()
  }

  if (!receivedDone) {
    throw new GroqProviderError('invalid_response', 'Groq ended the stream unexpectedly.')
  }
}
