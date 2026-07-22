import type {
  AskDocumentErrorResponse,
  AskDocumentRequest,
  AskDocumentStreamEvent,
} from '../../shared/ask-document'

const ENDPOINT = '/api/ask-document'

export class AskDocumentServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AskDocumentServiceError'
  }
}

function parseEvent(frame: string): AskDocumentStreamEvent | null {
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

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as Partial<AskDocumentErrorResponse>
    if (typeof body.error === 'string' && body.error.trim()) return body.error
  } catch {
    // The fallback below covers non-JSON proxy and server errors.
  }

  return 'The document assistant is temporarily unavailable. Please try again.'
}

export async function streamAskDocument(
  request: AskDocumentRequest,
  onDelta: (content: string) => void,
  signal: AbortSignal,
): Promise<void> {
  let response: Response

  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new AskDocumentServiceError(
      'Unable to reach the document assistant. Check your connection and try again.',
    )
  }

  if (!response.ok) throw new AskDocumentServiceError(await getErrorMessage(response))
  if (!response.body) {
    throw new AskDocumentServiceError('The document assistant returned an invalid response.')
  }

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
      if (!event) {
        throw new AskDocumentServiceError('The document assistant returned an invalid response.')
      }

      if (event.type === 'delta') {
        if (event.content) {
          receivedContent = true
          onDelta(event.content)
        }
      } else if (event.type === 'error') {
        throw new AskDocumentServiceError(event.message)
      } else {
        completed = true
      }
    }

    if (done) break
  }

  if (!completed || !receivedContent) {
    throw new AskDocumentServiceError('The document assistant returned an empty response.')
  }
}
