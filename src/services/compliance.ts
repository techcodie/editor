import type {
  ComplianceAiRequest,
  ComplianceAiResponse,
} from '../../shared/compliance'
import { AiStreamError, streamAiRequest } from './ai-stream'

export { AiStreamError as ComplianceServiceError }

function parseResponse(content: string): ComplianceAiResponse {
  const normalized = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  let parsed: unknown
  try {
    parsed = JSON.parse(normalized)
  } catch {
    throw new AiStreamError('Compliance AI returned an invalid response.')
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { recommendations?: unknown }).recommendations)) {
    throw new AiStreamError('Compliance AI returned an invalid response.')
  }
  const recommendations = (parsed as { recommendations: unknown[] }).recommendations.flatMap((value) => {
    if (!value || typeof value !== 'object') return []
    const item = value as Record<string, unknown>
    if (
      typeof item.findingId !== 'string' ||
      typeof item.title !== 'string' ||
      typeof item.description !== 'string' ||
      typeof item.confidence !== 'number' ||
      !Number.isFinite(item.confidence)
    ) return []
    return [{
      findingId: item.findingId,
      title: item.title.trim(),
      description: item.description.trim(),
      suggestedText: typeof item.suggestedText === 'string' && item.suggestedText.trim()
        ? item.suggestedText.trim()
        : undefined,
      confidence: Math.min(1, Math.max(0, item.confidence)),
    }]
  })
  return { recommendations }
}

export async function requestComplianceRecommendations(
  request: ComplianceAiRequest,
  signal: AbortSignal,
  endpoint = '/api/compliance-analysis',
): Promise<ComplianceAiResponse> {
  let content = ''
  await streamAiRequest(
    endpoint,
    request,
    {
      network: 'Unable to reach Compliance AI. Local findings remain available.',
      unavailable: 'Compliance AI is temporarily unavailable. Local findings remain available.',
      invalid: 'Compliance AI returned an invalid response.',
      empty: 'Compliance AI returned an empty response.',
    },
    (delta) => { content += delta },
    signal,
  )
  return parseResponse(content)
}
