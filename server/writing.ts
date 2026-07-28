import type { IncomingMessage, ServerResponse } from 'node:http'
import { isWritingRewriteAction, type WritingRewriteRequest } from '../shared/writing.js'
import { sendAiResponse } from './ai-response.js'
import {
  createRequestAbortController,
  handleRequestError,
  isRecord,
  readJson,
  RequestValidationError,
  requireJson,
} from './http.js'
import { buildWritingRewritePrompt, WRITING_SYSTEM_PROMPT } from './prompts.js'

const MAX_TEXT_CHARS = 24_000
const MAX_DOCUMENT_CHARS = 80_000

function validateRequest(value: unknown): WritingRewriteRequest {
  if (!isRecord(value)) throw new RequestValidationError(400, 'The writing request is invalid.')
  const text = typeof value.text === 'string' ? value.text.trim() : ''
  const document = typeof value.document === 'string' ? value.document.trim() : undefined
  if (!text) throw new RequestValidationError(400, 'Choose text to rewrite first.')
  if (!isWritingRewriteAction(value.action)) throw new RequestValidationError(400, 'The rewrite action is invalid.')
  if (text.length > MAX_TEXT_CHARS) throw new RequestValidationError(413, 'The selected writing scope is too long.')
  if (document && document.length > MAX_DOCUMENT_CHARS) throw new RequestValidationError(413, 'The document is too long to use as rewrite context.')
  return { text, action: value.action, document }
}

export async function handleWritingAssistant(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const abortController = createRequestAbortController(response)
  try {
    requireJson(request)
    const body = validateRequest(await readJson(request))
    await sendAiResponse(response, [
      { role: 'system', content: WRITING_SYSTEM_PROMPT },
      { role: 'user', content: buildWritingRewritePrompt(body) },
    ], {
      configuration: 'Writing assistance is not configured yet.',
      rateLimit: 'Writing assistance is busy. Please try again shortly.',
      invalid: 'Writing assistance returned an invalid response.',
      upstream: 'Writing assistance is temporarily unavailable.',
      unexpected: 'Writing assistance encountered an unexpected error.',
    }, abortController.signal)
  } catch (error) {
    if (!abortController.signal.aborted) {
      handleRequestError(response, error, 'Writing assistance', 'Writing assistance encountered an unexpected error.')
    }
  }
}
