import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ContractAiSummaryRequest } from '../shared/contract.js'
import { sendAiResponse } from './ai-response.js'
import { createRequestAbortController, handleRequestError, isRecord, readJson, RequestValidationError, requireJson } from './http.js'
import { buildContractSummaryPrompt, CONTRACT_SYSTEM_PROMPT } from './prompts.js'

function validItems(value: unknown, limit: number): Record<string, unknown>[] {
  if (!Array.isArray(value) || value.length > limit || value.some((item) => !isRecord(item))) throw new RequestValidationError(400, 'Contract analysis inputs are invalid.')
  return value as Record<string, unknown>[]
}

function validateRequest(value: unknown): ContractAiSummaryRequest {
  if (!isRecord(value)) throw new RequestValidationError(400, 'The request is invalid.')
  const document = typeof value.document === 'string' ? value.document.trim() : ''
  if (!document) throw new RequestValidationError(400, 'Add contract content before running analysis.')
  if (document.length > 120_000) throw new RequestValidationError(413, 'The contract is too long to analyze.')
  const clauses = validItems(value.clauses, 80)
  const obligations = validItems(value.obligations, 80)
  const dates = validItems(value.dates, 80)
  const risks = validItems(value.risks, 30)
  const missingSections = Array.isArray(value.missingSections) && value.missingSections.every((item) => typeof item === 'string') ? value.missingSections.slice(0, 30) : []
  return { document, clauses: clauses as ContractAiSummaryRequest['clauses'], obligations: obligations as ContractAiSummaryRequest['obligations'], dates: dates as ContractAiSummaryRequest['dates'], risks: risks as ContractAiSummaryRequest['risks'], missingSections }
}

export async function handleContractAnalysis(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const abortController = createRequestAbortController(response)
  try {
    requireJson(request)
    const body = validateRequest(await readJson(request))
    await sendAiResponse(response, [
      { role: 'system', content: CONTRACT_SYSTEM_PROMPT },
      { role: 'user', content: buildContractSummaryPrompt(body) },
    ], {
      configuration: 'Contract AI is not configured. Local analysis remains available.',
      rateLimit: 'Contract AI is busy. Local analysis remains available.',
      invalid: 'Contract AI returned an invalid response.',
      upstream: 'Contract AI is temporarily unavailable. Local analysis remains available.',
      unexpected: 'Contract AI encountered an unexpected error.',
    }, abortController.signal)
  } catch (error) {
    if (!abortController.signal.aborted) handleRequestError(response, error, 'Contract AI', 'Contract AI encountered an unexpected error.')
  }
}
