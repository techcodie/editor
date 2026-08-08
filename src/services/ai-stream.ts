import type { AiErrorResponse, AiStreamEvent } from '../../shared/ai'
import type { AskDocumentResponseMetadata } from '../../shared/ask-document'

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
    if (
      event.type === 'metadata' &&
      'metadata' in event &&
      isResponseMetadata(event.metadata)
    ) {
      return { type: 'metadata', metadata: event.metadata }
    }
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

function isResponseMetadata(value: unknown): value is AskDocumentResponseMetadata {
  if (!value || typeof value !== 'object') return false
  const metadata = value as Record<string, unknown>
  if (
    typeof metadata.model !== 'string' ||
    !metadata.model.trim() ||
    typeof metadata.contextSize !== 'number' ||
    !Number.isFinite(metadata.contextSize) ||
    metadata.contextSize < 0 ||
    !Array.isArray(metadata.sources)
  ) {
    return false
  }

  return metadata.sources.every((source) => {
    if (!source || typeof source !== 'object') return false
    const item = source as Record<string, unknown>
    return (
      typeof item.id === 'string' &&
      item.id.length > 0 &&
      typeof item.name === 'string' &&
      item.name.length > 0 &&
      typeof item.type === 'string' &&
      ['document', 'pdf', 'docx', 'txt', 'markdown', 'image'].includes(item.type) &&
      (item.pageCount === undefined ||
        (typeof item.pageCount === 'number' &&
          Number.isInteger(item.pageCount) &&
          item.pageCount > 0))
    )
  })
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
  onMetadata?: (metadata: AskDocumentResponseMetadata) => void,
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
      // A frame with no `data:` line at all is a bare SSE comment/keep-alive
      // (e.g. `: keep-alive`) — a standard technique proxies and load
      // balancers use to hold a long-running connection open past their own
      // idle timeout. It carries no event and must be silently skipped, not
      // treated as a malformed response: only a frame that *does* carry a
      // `data:` payload but fails to parse as one of the known event types
      // is an actual protocol error.
      const hasData = frame.split('\n').some((line) => line.startsWith('data:'))
      if (!hasData) continue
      const event = parseEvent(frame)
      if (!event) throw new AiStreamError(messages.invalid)

      if (event.type === 'delta') {
        if (event.content) {
          receivedContent = true
          onDelta(event.content)
        }
      } else if (event.type === 'error') {
        throw new AiStreamError(event.message)
      } else if (event.type === 'metadata') {
        onMetadata?.(event.metadata)
      } else {
        completed = true
      }
    }

    if (done) break
  }

  if (!completed || !receivedContent) throw new AiStreamError(messages.empty)
}
