import type { ContractAiSummaryRequest, ContractAiSummaryResponse } from '../../shared/contract'
import { AiStreamError, streamAiRequest } from './ai-stream'

export { AiStreamError as ContractServiceError }

function stringIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) return null
  return value.map((item) => item.trim()).filter(Boolean)
}

function parseResponse(content: string): ContractAiSummaryResponse {
  const normalized = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  let parsed: unknown
  try { parsed = JSON.parse(normalized) } catch { throw new AiStreamError('Contract AI returned an invalid response.') }
  if (!parsed || typeof parsed !== 'object') throw new AiStreamError('Contract AI returned an invalid response.')
  const value = parsed as Record<string, unknown>
  const keyObligationIds = stringIds(value.keyObligationIds)
  const majorRiskIds = stringIds(value.majorRiskIds)
  const importantDateIds = stringIds(value.importantDateIds)
  const criticalClauseIds = stringIds(value.criticalClauseIds)
  const missingSections = stringIds(value.missingSections)
  if (typeof value.executiveSummary !== 'string' || !value.executiveSummary.trim() || !keyObligationIds || !majorRiskIds || !importantDateIds || !criticalClauseIds || !missingSections) {
    throw new AiStreamError('Contract AI returned an invalid response.')
  }
  return { executiveSummary: value.executiveSummary.trim(), keyObligationIds, majorRiskIds, importantDateIds, criticalClauseIds, missingSections }
}

export async function requestContractSummary(
  request: ContractAiSummaryRequest,
  signal: AbortSignal,
  endpoint = '/api/contract-analysis',
): Promise<ContractAiSummaryResponse> {
  let content = ''
  await streamAiRequest(endpoint, request, {
    network: 'Unable to reach Contract AI. Local analysis remains available.',
    unavailable: 'Contract AI is temporarily unavailable. Local analysis remains available.',
    invalid: 'Contract AI returned an invalid response.',
    empty: 'Contract AI returned an empty response.',
  }, (delta) => { content += delta }, signal)
  return parseResponse(content)
}
