import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  ASK_DOCUMENT_HISTORY_LIMIT,
  type AskDocumentHistoryMessage,
  type AskDocumentRequest,
} from '../shared/ask-document.js'
import { sendAiResponse } from './ai-response.js'
import {
  createRequestAbortController,
  handleRequestError,
  isRecord,
  readJson,
  RequestValidationError,
  requireJson,
} from './http.js'
import { buildDocumentQuestionPrompt, ASK_DOCUMENT_SYSTEM_PROMPT } from './prompts.js'

const MAX_DOCUMENT_CHARS = 80_000
const MAX_QUESTION_CHARS = 2_000
const MAX_HISTORY_MESSAGE_CHARS = 4_000

function parseHistory(value: unknown): AskDocumentHistoryMessage[] {
  if (!Array.isArray(value)) throw new RequestValidationError(400, 'Conversation history is invalid.')

  return value.slice(-ASK_DOCUMENT_HISTORY_LIMIT).map((message) => {
    if (!isRecord(message)) throw new RequestValidationError(400, 'Conversation history is invalid.')

    const role = message.role
    const content = typeof message.content === 'string' ? message.content.trim() : ''
    if ((role !== 'user' && role !== 'assistant') || !content) {
      throw new RequestValidationError(400, 'Conversation history is invalid.')
    }
    if (content.length > MAX_HISTORY_MESSAGE_CHARS) {
      throw new RequestValidationError(413, 'A conversation message is too long.')
    }

    return { role, content }
  })
}

function validateRequest(value: unknown): AskDocumentRequest {
  if (!isRecord(value)) throw new RequestValidationError(400, 'The request is invalid.')

  const document = typeof value.document === 'string' ? value.document.trim() : ''
  const question = typeof value.question === 'string' ? value.question.trim() : ''

  if (!document) throw new RequestValidationError(400, 'Add some content to the document first.')
  if (!question) throw new RequestValidationError(400, 'Enter a question about the document.')
  if (document.length > MAX_DOCUMENT_CHARS) {
    throw new RequestValidationError(413, 'The current document is too long to analyze safely.')
  }
  if (question.length > MAX_QUESTION_CHARS) {
    throw new RequestValidationError(413, 'The question is too long. Please make it shorter.')
  }

  return { document, question, history: parseHistory(value.history) }
}

export async function handleAskDocument(
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
        { role: 'system', content: ASK_DOCUMENT_SYSTEM_PROMPT },
        ...body.history,
        {
          role: 'user',
          content: buildDocumentQuestionPrompt(body.document, body.question),
        },
      ],
      {
        configuration: 'The document assistant is not configured yet.',
        rateLimit: 'The document assistant is busy. Please try again shortly.',
        invalid: 'The document assistant returned an invalid response.',
        upstream: 'The document assistant is temporarily unavailable.',
        unexpected: 'The document assistant encountered an unexpected error.',
      },
      abortController.signal,
    )
  } catch (error) {
    if (!abortController.signal.aborted) {
      handleRequestError(
        response,
        error,
        'Ask Document',
        'The document assistant encountered an unexpected error.',
      )
    }
  }
}
