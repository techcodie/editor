import type { SelectionAiRequest } from '../../shared/ai'
import { AiStreamError, streamAiRequest } from './ai-stream'

const ENDPOINT = '/api/selection-ai'

export { AiStreamError as SelectionAiServiceError }

export function streamSelectionAi(
  request: SelectionAiRequest,
  onDelta: (content: string) => void,
  signal: AbortSignal,
): Promise<void> {
  return streamAiRequest(
    ENDPOINT,
    request,
    {
      network: 'Unable to reach Selection AI. Check your connection and try again.',
      unavailable: 'Selection AI is temporarily unavailable. Please try again.',
      invalid: 'Selection AI returned an invalid response.',
      empty: 'Selection AI returned an empty response.',
    },
    onDelta,
    signal,
  )
}
