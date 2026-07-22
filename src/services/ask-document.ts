import type { AskDocumentRequest } from '../../shared/ask-document'
import { AiStreamError, streamAiRequest } from './ai-stream'

const ENDPOINT = '/api/ask-document'

export { AiStreamError as AskDocumentServiceError }

export function streamAskDocument(
  request: AskDocumentRequest,
  onDelta: (content: string) => void,
  signal: AbortSignal,
): Promise<void> {
  return streamAiRequest(
    ENDPOINT,
    request,
    {
      network: 'Unable to reach the document assistant. Check your connection and try again.',
      unavailable: 'The document assistant is temporarily unavailable. Please try again.',
      invalid: 'The document assistant returned an invalid response.',
      empty: 'The document assistant returned an empty response.',
    },
    onDelta,
    signal,
  )
}
