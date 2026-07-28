import type { ContractAiSummaryRequest } from '../../../shared/contract'
import { createHistoryStorage } from '../../history/services/historyStorage'
import { createVersion } from '../../history/services/versionManager'
import type { EditorApi } from '../../lib/editor-api'
import { requestContractSummary } from '../../services/contract'
import { classifyClauses } from './clauseClassifier'
import { extractClauses } from './clauseExtractor'
import { extractContractDates, extractEntities, extractParties } from './entityExtractor'
import { extractObligations } from './obligationEngine'
import { validatePlaybook } from './playbookEngine'
import { extractRenewalTerms } from './renewalEngine'
import { analyzeContractRisks, scoreContractRisk } from './riskEngine'
import { buildContractSummary } from './summaryEngine'
import type { ContractAnalysis, ContractAnalysisHistoryEntry, ContractAnalysisOptions, ContractAnalysisProgress } from '../types/contract'

const CACHE_LIMIT = 8
const HISTORY_LIMIT = 12
const cache = new Map<string, ContractAnalysis>()

function abortIfNeeded(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('Contract analysis was cancelled.', 'AbortError')
}

function report(options: ContractAnalysisOptions, stage: ContractAnalysisProgress['stage'], progress: number, message: string): void {
  abortIfNeeded(options.signal)
  options.onProgress?.({ stage, progress, message })
}

export function fingerprintContract(value: string): string {
  let hash = 2_166_136_261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }
  return (hash >>> 0).toString(36)
}

function cacheKey(text: string, options: ContractAnalysisOptions): string {
  return fingerprintContract(`${text}\n${JSON.stringify(options.playbook ?? null)}\n${options.complianceFindings?.map((item) => `${item.id}:${item.severity}`).join('|') ?? ''}\n${options.aiEndpoint ?? ''}`)
}

function remember(key: string, analysis: ContractAnalysis): void {
  cache.delete(key)
  cache.set(key, analysis)
  while (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string)
}

function knownIds(values: { id: string }[]): Set<string> {
  return new Set(values.map((item) => item.id))
}

export async function analyzeContract(text: string, options: ContractAnalysisOptions = {}): Promise<ContractAnalysis> {
  const document = text.trim()
  if (!document) throw new Error('Add contract content before running analysis.')
  const key = cacheKey(document, options)
  if (options.useCache !== false && cache.has(key)) {
    report(options, 'complete', 100, 'Cached contract analysis ready')
    return structuredClone(cache.get(key) as ContractAnalysis)
  }

  report(options, 'clauses', 8, 'Extracting and classifying clauses')
  const clauses = classifyClauses(extractClauses(document), options.playbook?.customClauseRules)
  await Promise.resolve()
  report(options, 'entities', 24, 'Detecting parties and contract entities')
  const entities = extractEntities(document)
  const parties = extractParties(document)
  report(options, 'dates', 40, 'Building the contract timeline')
  const dates = extractContractDates(document, clauses, entities)
  const renewals = extractRenewalTerms(clauses, dates)
  report(options, 'obligations', 55, 'Mapping obligations and ownership')
  const obligations = extractObligations(clauses, parties, dates)
  report(options, 'playbook', 67, 'Checking the active playbook')
  const playbookDeviations = validatePlaybook(clauses, options.playbook)
  report(options, 'risk', 78, 'Scoring advisory risks')
  const risks = analyzeContractRisks({ clauses, obligations, dates, deviations: playbookDeviations, complianceFindings: options.complianceFindings })
  const overall = scoreContractRisk(risks)
  report(options, 'summary', 88, 'Preparing the contract summary')
  const base = { clauses, entities, parties, obligations, dates, renewals, risks, playbookDeviations, aiNotice: undefined }
  let summary = buildContractSummary(base)
  let aiEnhanced = false
  let aiNotice: string | undefined

  if (options.aiEndpoint) {
    report(options, 'ai', 93, 'Refining the summary with Contract AI')
    const request: ContractAiSummaryRequest = {
      document: document.slice(0, 120_000),
      clauses: clauses.slice(0, 80).map(({ id, title, type, text: clauseText }) => ({ id, title, type, text: clauseText.slice(0, 2_000) })),
      obligations: obligations.slice(0, 80).map(({ id, responsibleParty, action, dueDate }) => ({ id, responsibleParty, action, dueDate })),
      dates: dates.slice(0, 80).map(({ id, type, value }) => ({ id, type, value })),
      risks: risks.slice(0, 30).map(({ id, title, level, reason }) => ({ id, title, level, reason })),
      missingSections: summary.missingSections,
    }
    try {
      const ai = await requestContractSummary(request, options.signal ?? new AbortController().signal, options.aiEndpoint)
      const obligationIds = knownIds(obligations)
      const riskIds = knownIds(risks)
      const dateIds = knownIds(dates)
      const clauseIds = knownIds(clauses)
      summary = {
        executiveSummary: ai.executiveSummary,
        keyObligationIds: ai.keyObligationIds.filter((id) => obligationIds.has(id)),
        majorRiskIds: ai.majorRiskIds.filter((id) => riskIds.has(id)),
        importantDateIds: ai.importantDateIds.filter((id) => dateIds.has(id)),
        criticalClauseIds: ai.criticalClauseIds.filter((id) => clauseIds.has(id)),
        missingSections: ai.missingSections,
        source: 'ai',
      }
      aiEnhanced = true
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      const message = error instanceof Error ? error.message : ''
      aiNotice = message === 'Not found.'
        ? 'Contract AI is not configured. Local analysis remains available.'
        : `${message || 'Contract AI was unavailable.'} Local analysis remains available.`
    }
  }

  const analysis: ContractAnalysis = {
    id: crypto.randomUUID(), documentFingerprint: fingerprintContract(document), analyzedAt: Date.now(),
    ...base, summary, overallRiskScore: overall.score, overallRiskLevel: overall.level, aiEnhanced, aiNotice,
  }
  remember(key, analysis)
  report(options, 'complete', 100, 'Contract analysis ready')
  return structuredClone(analysis)
}

export function clearContractAnalysisCache(): void { cache.clear() }

function analysisHistoryKey(namespace: string): string { return `techcodie:editor:contract:v1:${namespace}` }

export function loadContractAnalysisHistory(namespace: string): ContractAnalysisHistoryEntry[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(analysisHistoryKey(namespace)) ?? '[]') as unknown
    return Array.isArray(value) ? value.slice(0, HISTORY_LIMIT) as ContractAnalysisHistoryEntry[] : []
  } catch { return [] }
}

export function saveContractAnalysisHistory(namespace: string, analysis: ContractAnalysis): ContractAnalysisHistoryEntry[] {
  const current = loadContractAnalysisHistory(namespace).filter((item) => item.fingerprint !== analysis.documentFingerprint)
  const entry: ContractAnalysisHistoryEntry = {
    id: crypto.randomUUID(), analyzedAt: analysis.analyzedAt, fingerprint: analysis.documentFingerprint,
    riskScore: analysis.overallRiskScore, riskLevel: analysis.overallRiskLevel,
    clauseTypes: [...new Set(analysis.clauses.map((item) => item.type))], clauseCount: analysis.clauses.length,
    obligationCount: analysis.obligations.length, analysis,
  }
  const next = [entry, ...current].slice(0, HISTORY_LIMIT)
  try { window.localStorage.setItem(analysisHistoryKey(namespace), JSON.stringify(next)) } catch { /* History is optional. */ }
  return next
}

export async function saveContractVersionSnapshot(api: EditorApi, namespace: string, author: { id: string; name: string }, analysis: ContractAnalysis): Promise<string> {
  const storage = createHistoryStorage(namespace)
  const versions = await storage.load()
  const version = await createVersion({
    name: `Contract analysis ${new Date(analysis.analyzedAt).toLocaleDateString()}`,
    description: `${analysis.clauses.length} clauses, ${analysis.obligations.length} obligations, risk ${analysis.overallRiskScore}/100.`,
    reason: 'Contract intelligence analysis checkpoint', comments: analysis.summary.executiveSummary,
    author, source: 'contract', content: { document: api.getDocumentSnapshot(), text: api.getDocumentText() },
  }, versions)
  await storage.save([version, ...versions])
  return version.id
}
