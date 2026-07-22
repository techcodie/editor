import type { AiErrorResponse, AiStreamEvent } from '../../shared/ai'

interface AiStreamMessages {
  network: string
  unavailable: string
  invalid: string
  empty: string
}

export class AiStreamError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AiStreamError'
  }
}

function parseEvent(frame: string): AiStreamEvent | null {
  const data = frame
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')

  if (!data) return null

  try {
    const event: unknown = JSON.parse(data)
    if (!event || typeof event !== 'object' || !('type' in event)) return null

    if (event.type === 'done') return { type: 'done' }
    if (event.type === 'delta' && 'content' in event && typeof event.content === 'string') {
      return { type: 'delta', content: event.content }
    }
    if (event.type === 'error' && 'message' in event && typeof event.message === 'string') {
      return { type: 'error', message: event.message }
    }
  } catch {
    return null
  }

  return null
}

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as Partial<AiErrorResponse>
    if (typeof body.error === 'string' && body.error.trim()) return body.error
  } catch {
    // The fallback covers non-JSON proxy and server errors.
  }

  return fallback
}

export async function streamAiRequest<TRequest>(
  endpoint: string,
  request: TRequest,
  messages: AiStreamMessages,
  onDelta: (content: string) => void,
  signal: AbortSignal,
): Promise<void> {
  let response: Response

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new AiStreamError(messages.network)
  }

  if (!response.ok) {
    throw new AiStreamError(await getErrorMessage(response, messages.unavailable))
  }
  if (!response.body) throw new AiStreamError(messages.invalid)

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let receivedContent = false
  let completed = false

  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value, { stream: !done }).replaceAll('\r\n', '\n')

    const frames = buffer.split('\n\n')
    buffer = done ? '' : (frames.pop() ?? '')

    for (const frame of frames) {
      if (!frame.trim()) continue
      const event = parseEvent(frame)
      if (!event) throw new AiStreamError(messages.invalid)

      if (event.type === 'delta') {
        if (event.content) {
          receivedContent = true
          onDelta(event.content)
        }
      } else if (event.type === 'error') {
        throw new AiStreamError(event.message)
      } else {
        completed = true
      }
    }

    if (done) break
  }

  if (!completed || !receivedContent) throw new AiStreamError(messages.empty)
}
