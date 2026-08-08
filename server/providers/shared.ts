export type ProviderErrorKind = 'configuration' | 'rate_limit' | 'upstream' | 'invalid_response'

export class ProviderError extends Error {
  constructor(
    readonly kind: ProviderErrorKind,
    message: string,
  ) {
    super(message)
    this.name = 'ProviderError'
  }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface StreamChunk {
  choices?: Array<{
    delta?: { content?: string | null }
  }>
}

export interface OpenAiCompatibleConfig {
  /** Human-readable name used only in error messages, e.g. "OpenAI" or "Groq". */
  label: string
  apiKeyEnv: string
  apiUrlEnv: string
  defaultApiUrl: string
  modelEnv: string
  defaultModel: string
  timeoutEnv: string
  defaultTimeoutMs: number
}

export interface AiProvider {
  label: string
  getModel(): string
  streamCompletion(messages: ChatMessage[], signal: AbortSignal): AsyncGenerator<string>
}

function parseChunk(label: string, data: string): string | null {
  let chunk: StreamChunk

  try {
    chunk = JSON.parse(data) as StreamChunk
  } catch {
    throw new ProviderError('invalid_response', `${label} returned malformed stream data.`)
  }

  const content = chunk.choices?.[0]?.delta?.content
  if (content == null) return null
  if (typeof content !== 'string') {
    throw new ProviderError('invalid_response', `${label} returned an invalid content delta.`)
  }

  return content
}

/**
 * Builds a provider for any OpenAI-compatible `/chat/completions` streaming
 * endpoint (OpenAI itself, and Groq — Groq's endpoint is literally
 * `.../openai/v1/chat/completions` and speaks the same wire format). The two
 * concrete providers (openai.ts, groq.ts) are thin config wrappers around
 * this so the SSE parsing/timeout/abort handling isn't duplicated between them.
 */
export function createOpenAiCompatibleProvider(config: OpenAiCompatibleConfig): AiProvider {
  function getModel(): string {
    return process.env[config.modelEnv]?.trim() || config.defaultModel
  }

  function getApiUrl(): string {
    const configured = process.env[config.apiUrlEnv]?.trim() || config.defaultApiUrl
    let url: URL
    try {
      url = new URL(configured)
    } catch {
      throw new ProviderError('configuration', `${config.apiUrlEnv} is invalid.`)
    }
    if (url.protocol !== 'https:') {
      throw new ProviderError('configuration', `${config.apiUrlEnv} must use HTTPS.`)
    }
    return url.toString()
  }

  function getTimeoutMs(): number {
    const configured = Number(process.env[config.timeoutEnv])
    return Number.isInteger(configured) && configured >= 1_000 && configured <= 120_000
      ? configured
      : config.defaultTimeoutMs
  }

  async function* streamCompletion(messages: ChatMessage[], signal: AbortSignal): AsyncGenerator<string> {
    const apiKey = process.env[config.apiKeyEnv]?.trim()
    if (!apiKey) {
      throw new ProviderError('configuration', `${config.apiKeyEnv} is not configured.`)
    }

    let response: Response
    const providerController = new AbortController()
    const handleAbort = () => providerController.abort(signal.reason)
    const timeout = setTimeout(
      () => providerController.abort(new DOMException(`${config.label} request timed out.`, 'TimeoutError')),
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
          model: getModel(),
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
      throw new ProviderError('upstream', `${config.label} could not be reached.`)
    }

    if (!response.ok) {
      cleanup()
      const kind: ProviderErrorKind = response.status === 429 ? 'rate_limit' : 'upstream'
      throw new ProviderError(kind, `${config.label} request failed with status ${response.status}.`)
    }
    if (!response.body) {
      cleanup()
      throw new ProviderError('invalid_response', `${config.label} returned no response body.`)
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

            const content = parseChunk(config.label, data)
            if (content) yield content
          }
        }

        if (done) break
      }
    } catch (error) {
      if (signal.aborted) throw new DOMException('AI request cancelled.', 'AbortError')
      if (providerController.signal.aborted) {
        throw new ProviderError('upstream', `${config.label} response timed out.`)
      }
      throw error
    } finally {
      cleanup()
      reader.releaseLock()
    }

    if (!receivedDone) {
      throw new ProviderError('invalid_response', `${config.label} ended the stream unexpectedly.`)
    }
  }

  return { label: config.label, getModel, streamCompletion }
}
