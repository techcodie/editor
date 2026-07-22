import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  isSelectionAiAction,
  type SelectionAiRequest,
} from '../shared/ai.js'
import { sendAiResponse } from './ai-response.js'
import {
  createRequestAbortController,
  handleRequestError,
  isRecord,
  readJson,
  RequestValidationError,
  requireJson,
} from './http.js'
import { buildSelectionActionPrompt, SELECTION_AI_SYSTEM_PROMPT } from './prompts.js'

const MAX_SELECTION_CHARS = 12_000
const MAX_DOCUMENT_CHARS = 80_000

function validateRequest(value: unknown): SelectionAiRequest {
  if (!isRecord(value)) throw new RequestValidationError(400, 'The request is invalid.')

  const selection = typeof value.selection === 'string' ? value.selection.trim() : ''
  const document = typeof value.document === 'string' ? value.document.trim() : undefined

  if (!selection) throw new RequestValidationError(400, 'Select some text before using AI.')
  if (!isSelectionAiAction(value.action)) {
    throw new RequestValidationError(400, 'The selected AI action is invalid.')
  }
  if (selection.length > MAX_SELECTION_CHARS) {
    throw new RequestValidationError(413, 'The selected text is too long. Select a smaller passage.')
  }
  if (document && document.length > MAX_DOCUMENT_CHARS) {
    throw new RequestValidationError(413, 'The current document is too long to use as context.')
  }

  return { selection, action: value.action, document }
}

export async function handleSelectionAi(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const abortController = createRequestAbortController(response)

  try {
    requireJson(request)
    const body = validateRequest(await readJson(request))
    await sendAiResponse(
      response,
      [
        { role: 'system', content: SELECTION_AI_SYSTEM_PROMPT },
        {
          role: 'user',
          content: buildSelectionActionPrompt(body.selection, body.action, body.document),
        },
      ],
      {
        configuration: 'Selection AI is not configured yet.',
        rateLimit: 'Selection AI is busy. Please try again shortly.',
        invalid: 'Selection AI returned an invalid response.',
        upstream: 'Selection AI is temporarily unavailable.',
        unexpected: 'Selection AI encountered an unexpected error.',
      },
      abortController.signal,
    )
  } catch (error) {
    if (!abortController.signal.aborted) {
      handleRequestError(
        response,
        error,
        'Selection AI',
        'Selection AI encountered an unexpected error.',
      )
    }
  }
}
