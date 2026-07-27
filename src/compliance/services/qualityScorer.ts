import type {
  ComplianceFinding,
  ComplianceSeverity,
  ComplianceSummaryData,
} from '../types/compliance'

const SEVERITY_COST: Record<ComplianceSeverity, number> = {
  low: 2,
  medium: 6,
  high: 12,
  critical: 24,
}

export function summarizeFindings(findings: ComplianceFinding[]): ComplianceSummaryData {
  return {
    total: findings.length,
    low: findings.filter((finding) => finding.severity === 'low').length,
    medium: findings.filter((finding) => finding.severity === 'medium').length,
    high: findings.filter((finding) => finding.severity === 'high').length,
    critical: findings.filter((finding) => finding.severity === 'critical').length,
    missingClauses: findings.filter((finding) => finding.type === 'missing-clause').length,
  }
}

export function scoreDocumentQuality(findings: ComplianceFinding[]): {
  score: number
  riskLevel: ComplianceSeverity
} {
  const rawPenalty = findings.reduce(
    (total, finding) => total + SEVERITY_COST[finding.severity] * finding.confidence,
    0,
  )
  const score = Math.max(0, Math.round(100 - rawPenalty))
  const summary = summarizeFindings(findings)
  const riskLevel: ComplianceSeverity = summary.critical > 0 || score < 40
    ? 'critical'
    : summary.high > 0 || score < 65
      ? 'high'
      : summary.medium > 0 || score < 82
        ? 'medium'
        : 'low'
  return { score, riskLevel }
}
