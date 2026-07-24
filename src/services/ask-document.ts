import type {
  AskDocumentRequest,
  AskDocumentResponseMetadata,
} from '../../shared/ask-document'
import { AiStreamError, streamAiRequest } from './ai-stream'

const ENDPOINT = '/api/ask-document'

export { AiStreamError as AskDocumentServiceError }

export async function streamAskDocument(
  request: AskDocumentRequest,
  onDelta: (content: string) => void,
  onMetadata: (metadata: AskDocumentResponseMetadata) => void,
  signal: AbortSignal,
): Promise<void> {
  let receivedMetadata = false

  await streamAiRequest(
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
