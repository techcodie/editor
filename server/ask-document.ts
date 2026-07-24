import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  ASK_DOCUMENT_HISTORY_LIMIT,
  CURRENT_DOCUMENT_SOURCE_ID,
  type AskDocumentHistoryMessage,
  type AskDocumentKnowledgeSource,
  type AskDocumentRequest,
  type AskDocumentSourceMetadata,
  type AskDocumentSourceType,
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
import { getGroqModel } from './providers/groq.js'

const MAX_DOCUMENT_CHARS = 80_000
const MAX_KNOWLEDGE_SOURCE_CHARS = 120_000
const MAX_TOTAL_CONTEXT_CHARS = 220_000
const MAX_KNOWLEDGE_SOURCES = 20
const MAX_SOURCE_NAME_CHARS = 255
const MAX_SOURCE_ID_CHARS = 128
const MAX_QUESTION_CHARS = 2_000
const MAX_HISTORY_MESSAGE_CHARS = 4_000
const SOURCE_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/
const SOURCE_TYPES = new Set<AskDocumentSourceType>([
  'document',
  'pdf',
  'docx',
  'txt',
  'markdown',
])

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

function parseKnowledgeSources(value: unknown): AskDocumentKnowledgeSource[] {
  if (!Array.isArray(value)) {
    throw new RequestValidationError(400, 'Active knowledge sources are invalid.')
  }
  if (value.length > MAX_KNOWLEDGE_SOURCES) {
    throw new RequestValidationError(413, 'Too many knowledge sources are active.')
  }
  const seenSourceIds = new Set([CURRENT_DOCUMENT_SOURCE_ID])

  return value.flatMap<AskDocumentKnowledgeSource>((source) => {
    if (!isRecord(source)) return []

    const id = typeof source.id === 'string' ? source.id.trim() : ''
    const name = typeof source.name === 'string' ? source.name.trim().replace(/\s+/g, ' ') : ''
    const type = source.type
    const content = typeof source.content === 'string' ? source.content.trim() : ''
    const pageCount =
      typeof source.pageCount === 'number' &&
      Number.isInteger(source.pageCount) &&
      source.pageCount > 0
        ? source.pageCount
        : undefined
    if (
      !id ||
      seenSourceIds.has(id) ||
      !name ||
      !content ||
      typeof type !== 'string' ||
      !SOURCE_TYPES.has(type as AskDocumentSourceType)
    ) {
      return []
    }
    if (id.length > MAX_SOURCE_ID_CHARS) {
      throw new RequestValidationError(413, 'A knowledge source identifier is too long.')
    }
    if (!SOURCE_ID_PATTERN.test(id)) {
      throw new RequestValidationError(400, 'A knowledge source identifier is invalid.')
    }
    if (name.length > MAX_SOURCE_NAME_CHARS) {
      throw new RequestValidationError(413, 'A knowledge source name is too long.')
    }
    if (content.length > MAX_KNOWLEDGE_SOURCE_CHARS) {
      throw new RequestValidationError(413, `${name} is too long to analyze safely.`)
    }

    seenSourceIds.add(id)
    return [{ id, name, type: type as AskDocumentSourceType, pageCount, content }]
  })
}

function getResponseSources(
  activeKnowledgeSources: AskDocumentKnowledgeSource[],
): AskDocumentSourceMetadata[] {
  return [
    {
      id: CURRENT_DOCUMENT_SOURCE_ID,
      name: 'Current Document',
      type: 'document',
    },
    ...activeKnowledgeSources.map(({ id, name, type, pageCount }) => ({
      id,
      name,
      type,
      pageCount,
    })),
  ]
}

function validateRequest(value: unknown): AskDocumentRequest {
  if (!isRecord(value)) throw new RequestValidationError(400, 'The request is invalid.')

  const currentDocument =
    typeof value.currentDocument === 'string' ? value.currentDocument.trim() : ''
  const activeKnowledgeSources = parseKnowledgeSources(value.activeKnowledgeSources)
  const userQuestion = typeof value.userQuestion === 'string' ? value.userQuestion.trim() : ''
  const totalContextCharacters =
    currentDocument.length +
    activeKnowledgeSources.reduce((total, source) => total + source.content.length, 0)

  if (!currentDocument && activeKnowledgeSources.length === 0) {
    throw new RequestValidationError(
      400,
      'Add content to the current document or activate a readable knowledge source.',
    )
  }
  if (!userQuestion) throw new RequestValidationError(400, 'Enter a question about the workspace.')
  if (currentDocument.length > MAX_DOCUMENT_CHARS) {
    throw new RequestValidationError(413, 'The current document is too long to analyze safely.')
  }
  if (totalContextCharacters > MAX_TOTAL_CONTEXT_CHARS) {
    throw new RequestValidationError(
      413,
      'The active workspace context is too large. Disable one or more sources and try again.',
    )
  }
  if (userQuestion.length > MAX_QUESTION_CHARS) {
    throw new RequestValidationError(413, 'The question is too long. Please make it shorter.')
  }

  return {
    currentDocument,
    activeKnowledgeSources,
    conversation: parseHistory(value.conversation),
    userQuestion,
  }
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
        ...body.conversation,
        {
          role: 'user',
          content: buildDocumentQuestionPrompt(
            body.currentDocument,
            body.activeKnowledgeSources,
            body.userQuestion,
          ),
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
      {
        model: getGroqModel(),
        sources: getResponseSources(body.activeKnowledgeSources),
        contextSize:
          body.currentDocument.length +
          body.activeKnowledgeSources.reduce((total, source) => total + source.content.length, 0),
      },
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
