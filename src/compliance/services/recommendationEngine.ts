import type {
  ComplianceFinding,
  ComplianceRecommendation,
  ComplianceReport,
} from '../types/compliance'

export function buildRuleRecommendations(
  findings: ComplianceFinding[],
): ComplianceRecommendation[] {
  return findings.map((finding) => ({
    id: crypto.randomUUID(),
    findingId: finding.id,
    title: finding.title,
    description: finding.recommendation,
    suggestedText: finding.suggestedText,
    confidence: finding.confidence,
    source: 'rule',
  }))
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function exportComplianceReport(report: ComplianceReport, title: string): void {
  const findings = report.findings.map((finding) => `
    <section>
      <p class="severity">${escapeHtml(finding.severity.toUpperCase())}</p>
      <h2>${escapeHtml(finding.title)}</h2>
      <p>${escapeHtml(finding.description)}</p>
      <dl><dt>Location</dt><dd>${escapeHtml(finding.location.label)}</dd><dt>Confidence</dt><dd>${Math.round(finding.confidence * 100)}%</dd></dl>
      <p><strong>Recommendation:</strong> ${escapeHtml(finding.recommendation)}</p>
    </section>`).join('')
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)} compliance report</title><style>body{max-width:880px;margin:48px auto;padding:0 24px;font:15px/1.6 system-ui;color:#171717}header{border-bottom:2px solid #171717;margin-bottom:28px}h1{font-size:28px}h2{font-size:18px}.score{font-size:44px;font-weight:700}.severity{font-size:12px;font-weight:700;letter-spacing:.08em}section{border-bottom:1px solid #ddd;padding:20px 0}dl{display:grid;grid-template-columns:100px 1fr;gap:4px 12px}dt{font-weight:600}@media print{body{margin:0}}</style></head><body><header><h1>${escapeHtml(title)} compliance report</h1><p>Generated ${new Date(report.analyzedAt).toLocaleString()}</p><p class="score">${report.score}/100</p><p>Risk level: <strong>${escapeHtml(report.riskLevel.toUpperCase())}</strong> · ${report.summary.total} findings</p></header>${findings || '<p>No findings were detected.</p>'}<footer><p>This report is advisory and is not legal certification.</p></footer></body></html>`
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${title.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'document'}-compliance-report.html`
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}
