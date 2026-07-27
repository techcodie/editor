import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ComplianceAiFinding, ComplianceAiRequest } from '../shared/compliance.js'
import { sendAiResponse } from './ai-response.js'
import {
  createRequestAbortController,
  handleRequestError,
  isRecord,
  readJson,
  RequestValidationError,
  requireJson,
} from './http.js'
import { buildCompliancePrompt, COMPLIANCE_SYSTEM_PROMPT } from './prompts.js'

const SEVERITIES = new Set(['low', 'medium', 'high', 'critical'])

function validateFinding(value: unknown): ComplianceAiFinding {
  if (!isRecord(value)) throw new RequestValidationError(400, 'A compliance finding is invalid.')
  const required = ['id', 'title', 'description', 'recommendation'] as const
  for (const key of required) {
    if (typeof value[key] !== 'string' || !value[key].trim()) {
      throw new RequestValidationError(400, 'A compliance finding is incomplete.')
    }
  }
  if (typeof value.severity !== 'string' || !SEVERITIES.has(value.severity)) {
    throw new RequestValidationError(400, 'A compliance severity is invalid.')
  }
  return {
    id: value.id as string,
    title: value.title as string,
    description: value.description as string,
    severity: value.severity as ComplianceAiFinding['severity'],
    quote: typeof value.quote === 'string' ? value.quote.slice(0, 2_000) : undefined,
    recommendation: value.recommendation as string,
  }
}

function validateRequest(value: unknown): ComplianceAiRequest {
  if (!isRecord(value)) throw new RequestValidationError(400, 'The request is invalid.')
  const document = typeof value.document === 'string' ? value.document.trim() : ''
  if (!document) throw new RequestValidationError(400, 'Add document content before running compliance analysis.')
  if (document.length > 120_000) throw new RequestValidationError(413, 'The document is too long to analyze.')
  if (!Array.isArray(value.findings) || value.findings.length > 20) {
    throw new RequestValidationError(400, 'Compliance findings must contain no more than 20 items.')
  }
  return { document, findings: value.findings.map(validateFinding) }
}

export async function handleComplianceAnalysis(
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
        { role: 'system', content: COMPLIANCE_SYSTEM_PROMPT },
        { role: 'user', content: buildCompliancePrompt(body) },
      ],
      {
        configuration: 'Compliance AI is not configured. Local findings remain available.',
        rateLimit: 'Compliance AI is busy. Local findings remain available.',
        invalid: 'Compliance AI returned an invalid response.',
        upstream: 'Compliance AI is temporarily unavailable. Local findings remain available.',
        unexpected: 'Compliance AI encountered an unexpected error.',
      },
      abortController.signal,
    )
  } catch (error) {
    if (!abortController.signal.aborted) {
      handleRequestError(response, error, 'Compliance AI', 'Compliance AI encountered an unexpected error.')
    }
  }
}
