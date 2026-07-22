const DEFAULT_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'llama-3.1-8b-instant'

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

export async function* streamGroqCompletion(
  messages: GroqChatMessage[],
  signal: AbortSignal,
): AsyncGenerator<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim()
  if (!apiKey) {
    throw new GroqProviderError('configuration', 'GROQ_API_KEY is not configured.')
  }

  let response: Response
  try {
    response = await fetch(process.env.GROQ_API_URL ?? DEFAULT_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL,
        messages,
        stream: true,
        temperature: 0.1,
        max_completion_tokens: 1200,
      }),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new GroqProviderError('upstream', 'Groq could not be reached.')
  }

  if (!response.ok) {
    const kind: GroqErrorKind = response.status === 429 ? 'rate_limit' : 'upstream'
    throw new GroqProviderError(kind, `Groq request failed with status ${response.status}.`)
  }
  if (!response.body) {
    throw new GroqProviderError('invalid_response', 'Groq returned no response body.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let receivedDone = false

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

  if (!receivedDone) {
    throw new GroqProviderError('invalid_response', 'Groq ended the stream unexpectedly.')
  }
}
