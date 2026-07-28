import { extractFormFields } from '../../forms/services/formSerializer'
import { createDocumentModelFromText } from '../../intelligence/services/documentIntelligence'
import type { EditorApi } from '../../lib/editor-api'
import { analyzeCompliance, fingerprintDocument } from '../../compliance/services/complianceEngine'
import type { Workflow, WorkflowValidation, WorkflowValidationIssue } from '../types/workflow'

export async function inspectWorkflowDocument(api: EditorApi | null): Promise<number> {
  if (!api) return 0
  const text = api.getDocumentText().trim()
  const formFields = extractFormFields(api.getDocumentSnapshot())
  if (!text && formFields.length === 0) return 0
  const fingerprint = fingerprintDocument(`${text}\n${JSON.stringify(formFields)}`)
  const model = createDocumentModelFromText(text || 'Interactive form')
  const report = await analyzeCompliance({ model, documentFingerprint: fingerprint, formFields })
  return report.findings.filter((finding) => finding.severity === 'critical').length
}

export function validateWorkflow(
  workflow: Workflow | null,
  unresolvedSuggestions: number,
  criticalFindings: number,
  checking = false,
  contractRiskScore = 0,
  contractHighRisks = 0,
): WorkflowValidation {
  const issues: WorkflowValidationIssue[] = []
  if (!workflow?.stages.length) issues.push({ id: 'missing-stages', title: 'Review stage required', description: 'Add at least one stage before submitting.', severity: 'blocking', source: 'workflow' })
  for (const stage of workflow?.stages ?? []) {
    if (stage.reviewerIds.length === 0) issues.push({ id: `missing-reviewer-${stage.id}`, title: `${stage.name} needs a reviewer`, description: 'Assign at least one reviewer to every stage.', severity: 'blocking', source: 'workflow' })
  }
  if (criticalFindings > 0) issues.push({ id: 'critical-compliance', title: `${criticalFindings} critical compliance finding${criticalFindings === 1 ? '' : 's'}`, description: workflow?.metadata.complianceGate ? 'Resolve critical findings before approval.' : 'Critical findings are advisory with the compliance gate disabled.', severity: workflow?.metadata.complianceGate ? 'blocking' : 'warning', source: 'compliance' })
  if (unresolvedSuggestions > 0) issues.push({ id: 'unresolved-suggestions', title: `${unresolvedSuggestions} unresolved suggestion${unresolvedSuggestions === 1 ? '' : 's'}`, description: workflow?.metadata.requireResolvedSuggestions ? 'Resolve every tracked suggestion before approval.' : 'Unresolved suggestions are advisory with this policy disabled.', severity: workflow?.metadata.requireResolvedSuggestions ? 'blocking' : 'warning', source: 'track-changes' })
  if (contractHighRisks > 0) issues.push({ id: 'contract-risk', title: `${contractHighRisks} high-priority contract risk${contractHighRisks === 1 ? '' : 's'}`, description: workflow?.metadata.contractRiskGate ? `Review contract risks before approval. Current advisory score: ${contractRiskScore}/100.` : 'Contract risks are advisory with the contract gate disabled.', severity: workflow?.metadata.contractRiskGate ? 'blocking' : 'warning', source: 'contract' })
  return {
    valid: !issues.some((issue) => issue.severity === 'blocking'),
    checking,
    criticalFindings,
    unresolvedSuggestions,
    contractRiskScore,
    contractHighRisks,
    issues,
    checkedAt: checking ? undefined : Date.now(),
  }
}
