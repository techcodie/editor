import type {
  AskDocumentRequest,
  AskDocumentResponseMetadata,
} from '../../shared/ask-document'
import { AiStreamError, streamAiRequest } from './ai-stream'

export { AiStreamError as AskDocumentServiceError }

export async function streamAskDocument(
  request: AskDocumentRequest,
  onDelta: (content: string) => void,
  onMetadata: (metadata: AskDocumentResponseMetadata) => void,
  signal: AbortSignal,
  endpoint = '/api/ask-document',
): Promise<void> {
  let receivedMetadata = false

  await streamAiRequest(
    endpoint,
    request,
    {
      network: 'Unable to reach the document assistant. Check your connection and try again.',
      unavailable: 'The document assistant is temporarily unavailable. Please try again.',
      invalid: 'The document assistant returned an invalid response.',
      empty: 'The document assistant returned an empty response.',
    },
    onDelta,
    signal,
    (metadata) => {
      receivedMetadata = true
      onMetadata(metadata)
    },
  )

  if (!receivedMetadata) {
    throw new AiStreamError(
      'The document assistant returned incomplete response details.',
    )
  }
}
