import type { ContractAnalysis, ContractSummary } from '../types/contract'

export function buildContractSummary(input: Omit<ContractAnalysis, 'id' | 'documentFingerprint' | 'analyzedAt' | 'summary' | 'overallRiskScore' | 'overallRiskLevel' | 'aiEnhanced'>): ContractSummary {
  const clauseTypes = [...new Set(input.clauses.filter((item) => item.type !== 'general').map((item) => item.type))]
  const partyNames = input.parties.map((party) => party.name)
  const executiveSummary = [
    `This document contains ${input.clauses.length} extracted clause${input.clauses.length === 1 ? '' : 's'}`,
    partyNames.length ? `between or involving ${partyNames.slice(0, 4).join(', ')}` : 'with no confidently detected parties',
    `${input.obligations.length} obligation${input.obligations.length === 1 ? '' : 's'}, ${input.dates.length} key date${input.dates.length === 1 ? '' : 's'}, and ${input.risks.length} advisory risk finding${input.risks.length === 1 ? '' : 's'}.`,
    clauseTypes.length ? `Classified coverage includes ${clauseTypes.slice(0, 6).map((value) => String(value).replaceAll('-', ' ')).join(', ')}.` : '',
  ].filter(Boolean).join(' ')
  return {
    executiveSummary,
    keyObligationIds: input.obligations.toSorted((left, right) => ['critical', 'high', 'medium', 'low'].indexOf(left.priority) - ['critical', 'high', 'medium', 'low'].indexOf(right.priority)).slice(0, 8).map((item) => item.id),
    majorRiskIds: input.risks.filter((risk) => ['high', 'critical'].includes(risk.level)).slice(0, 8).map((risk) => risk.id),
    importantDateIds: input.dates.filter((date) => date.type !== 'other').slice(0, 10).map((date) => date.id),
    criticalClauseIds: [...new Set(input.risks.filter((risk) => ['high', 'critical'].includes(risk.level)).flatMap((risk) => risk.supportingClauseIds))].slice(0, 10),
    missingSections: input.playbookDeviations.filter((item) => item.type === 'missing-required-clause').map((item) => item.title),
    source: 'local',
  }
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

export type ContractReportKind = 'summary' | 'risks' | 'clauses' | 'obligations'

export function exportContractReport(analysis: ContractAnalysis, kind: ContractReportKind): void {
  const title = `Contract ${kind[0].toLocaleUpperCase()}${kind.slice(1)} Report`
  const rows = kind === 'risks'
    ? analysis.risks.map((risk) => `<tr><td>${escapeHtml(risk.level)}</td><td>${escapeHtml(risk.title)}</td><td>${risk.score}</td><td>${escapeHtml(risk.reason)}</td></tr>`)
    : kind === 'clauses'
      ? analysis.clauses.map((clause) => `<tr><td>${escapeHtml(String(clause.type))}</td><td>${escapeHtml(clause.title)}</td><td>${Math.round(clause.confidence * 100)}%</td><td>${escapeHtml(clause.text)}</td></tr>`)
      : kind === 'obligations'
        ? analysis.obligations.map((item) => `<tr><td>${escapeHtml(item.responsibleParty)}</td><td>${escapeHtml(item.action)}</td><td>${escapeHtml(item.dueDate ?? '')}</td><td>${escapeHtml(item.priority)}</td></tr>`)
        : [`<tr><td>Executive summary</td><td>${escapeHtml(analysis.summary.executiveSummary)}</td></tr>`, `<tr><td>Risk score</td><td>${analysis.overallRiskScore} / 100 (${escapeHtml(analysis.overallRiskLevel)})</td></tr>`, `<tr><td>Clauses</td><td>${analysis.clauses.length}</td></tr>`, `<tr><td>Obligations</td><td>${analysis.obligations.length}</td></tr>`]
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><style>body{max-width:960px;margin:40px auto;padding:0 24px;color:#171717;font:14px/1.5 Arial,sans-serif}h1{font-size:24px}table{width:100%;border-collapse:collapse}td{padding:9px;border:1px solid #ddd;vertical-align:top}tr:nth-child(even){background:#f7f7f7}</style></head><body><h1>${title}</h1><p>Generated ${new Date(analysis.analyzedAt).toLocaleString()}. Advisory analysis only; not legal advice.</p><table><tbody>${rows.join('')}</tbody></table></body></html>`
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `contract-${kind}-report.html`
  anchor.click()
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}
