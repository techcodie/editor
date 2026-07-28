import type { ComplianceAiRequest } from '../../../shared/compliance'
import { requestComplianceRecommendations } from '../../services/compliance'
import type {
  ComplianceAnalysisInput,
  ComplianceEngineOptions,
  ComplianceFinding,
  ComplianceProgress,
  ComplianceReport,
  ComplianceSeverity,
} from '../types/compliance'
import { analyzeClauses } from './clauseAnalyzer'
import { scoreDocumentQuality, summarizeFindings } from './qualityScorer'
import { buildRuleRecommendations } from './recommendationEngine'
import { detectRisks } from './riskDetector'

const CACHE_LIMIT = 8
const reportCache = new Map<string, ComplianceReport>()
const severityOrder: Record<ComplianceSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

function abortError(): DOMException {
  return new DOMException('Compliance analysis was cancelled.', 'AbortError')
}

function ensureActive(signal?: AbortSignal) {
  if (signal?.aborted) throw abortError()
}

function notify(
  options: ComplianceEngineOptions,
  stage: ComplianceProgress['stage'],
  progress: number,
  message: string,
) {
  options.onProgress?.({ stage, progress, message })
}

async function yieldToBrowser(signal?: AbortSignal): Promise<void> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0))
  ensureActive(signal)
}

function cacheReport(key: string, report: ComplianceReport) {
  reportCache.delete(key)
  reportCache.set(key, report)
  if (reportCache.size > CACHE_LIMIT) {
    const oldest = reportCache.keys().next().value
    if (oldest) reportCache.delete(oldest)
  }
}

function applyAiRecommendations(
  findings: ComplianceFinding[],
  response: Awaited<ReturnType<typeof requestComplianceRecommendations>>,
) {
  const byFinding = new Map(response.recommendations.map((item) => [item.findingId, item]))
  const enrichedFindings = findings.map((finding) => {
    const recommendation = byFinding.get(finding.id)
    return recommendation
      ? {
          ...finding,
          recommendation: recommendation.description,
          suggestedText: recommendation.suggestedText,
        }
      : finding
  })
  const recommendations = response.recommendations.map((recommendation) => ({
    id: crypto.randomUUID(),
    findingId: recommendation.findingId,
    title: recommendation.title,
    description: recommendation.description,
    suggestedText: recommendation.suggestedText,
    confidence: recommendation.confidence,
    source: 'ai' as const,
  }))
  return { enrichedFindings, recommendations }
}

export function fingerprintDocument(text: string): string {
  let hash = 2_166_136_261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }
  return `${text.length}-${(hash >>> 0).toString(16)}`
}

export async function analyzeCompliance(
  input: ComplianceAnalysisInput,
  options: ComplianceEngineOptions = {},
): Promise<ComplianceReport> {
  const cacheKey = `${input.documentFingerprint}:${options.aiEndpoint ?? 'local'}`
  const cached = options.useCache === false ? undefined : reportCache.get(cacheKey)
  if (cached) {
    notify(options, 'complete', 100, 'Analysis ready from local cache')
    return cached
  }

  notify(options, 'preparing', 6, 'Preparing structured document')
  await yieldToBrowser(options.signal)
  notify(options, 'rules', 28, 'Checking document risks')
  const findings = detectRisks(input.model, input.formFields)
  await yieldToBrowser(options.signal)
  notify(options, 'clauses', 54, 'Reviewing clause coverage')
  findings.push(...analyzeClauses(input.model))
  const sortedFindings = findings
    .sort((left, right) => severityOrder[left.severity] - severityOrder[right.severity])
    .slice(0, 50)
  await yieldToBrowser(options.signal)
  notify(options, 'scoring', 72, 'Calculating document quality')
  const quality = scoreDocumentQuality(sortedFindings)
  let reportFindings = sortedFindings
  let recommendations = buildRuleRecommendations(sortedFindings)
  let aiEnhanced = false
  let aiNotice: string | undefined

  if (options.aiEndpoint && sortedFindings.length > 0) {
    notify(options, 'ai', 84, 'Generating grounded recommendations')
    const request: ComplianceAiRequest = {
      document: input.model.text,
      findings: sortedFindings.slice(0, 20).map((finding) => ({
        id: finding.id,
        title: finding.title,
        description: finding.description,
        severity: finding.severity,
        quote: finding.location.quote,
        recommendation: finding.recommendation,
      })),
    }
    try {
      const response = await requestComplianceRecommendations(
        request,
        options.signal ?? new AbortController().signal,
        options.aiEndpoint,
      )
      const enriched = applyAiRecommendations(sortedFindings, response)
      reportFindings = enriched.enrichedFindings
      if (enriched.recommendations.length > 0) {
        const enrichedIds = new Set(enriched.recommendations.map((item) => item.findingId))
        recommendations = [
          ...enriched.recommendations,
          ...recommendations.filter((item) => !enrichedIds.has(item.findingId)),
        ]
        aiEnhanced = true
      }
    } catch (error) {
      ensureActive(options.signal)
      aiNotice = error instanceof Error
        ? error.message
        : 'AI recommendations are unavailable. Local findings remain available.'
    }
  }

  ensureActive(options.signal)
  const report: ComplianceReport = {
    id: crypto.randomUUID(),
    documentId: input.model.id,
    analyzedAt: Date.now(),
    score: quality.score,
    riskLevel: quality.riskLevel,
    findings: reportFindings,
    recommendations,
    summary: summarizeFindings(reportFindings),
    aiEnhanced,
    aiNotice,
  }
  cacheReport(cacheKey, report)
  notify(options, 'complete', 100, 'Compliance analysis complete')
  return report
}
