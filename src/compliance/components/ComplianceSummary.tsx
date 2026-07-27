import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { ComplianceReport, ComplianceSeverity } from '../types/compliance'

interface ComplianceSummaryProps { report: ComplianceReport }

const tone: Record<ComplianceSeverity, string> = {
  low: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  medium: 'bg-amber-50 text-amber-800 ring-amber-200',
  high: 'bg-orange-50 text-orange-800 ring-orange-200',
  critical: 'bg-red-50 text-red-700 ring-red-200',
}

export function ComplianceSummary({ report }: ComplianceSummaryProps) {
  const Icon = report.riskLevel === 'low' ? CheckCircle2 : report.riskLevel === 'critical' ? ShieldAlert : AlertTriangle
  return (
    <section aria-labelledby="compliance-summary-title" className="border-b border-neutral-200 px-4 py-4">
      <div className="flex items-start gap-4">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-neutral-50 ring-1 ring-neutral-200">
          <span className="text-2xl font-semibold tabular-nums text-neutral-950">{report.score}</span>
          <span className="absolute bottom-3 text-[9px] font-medium text-neutral-400">/ 100</span>
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <h3 id="compliance-summary-title" className="text-xs font-semibold text-neutral-950">Document quality</h3>
          <span className={cn('mt-2 inline-flex items-center gap-1.5 rounded px-2 py-1 text-[10px] font-semibold uppercase ring-1 ring-inset', tone[report.riskLevel])}>
            <Icon size={12} aria-hidden /> {report.riskLevel} risk
          </span>
          <p className="mt-2 text-[11px] leading-4 text-neutral-500">{report.summary.total} findings, including {report.summary.missingClauses} missing {report.summary.missingClauses === 1 ? 'clause' : 'clauses'}.</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-1.5 text-center">
        {(['critical', 'high', 'medium', 'low'] as const).map((severity) => (
          <div key={severity} className="rounded-md bg-neutral-50 px-1 py-2">
            <strong className="block text-xs tabular-nums text-neutral-900">{report.summary[severity]}</strong>
            <span className="text-[9px] capitalize text-neutral-500">{severity}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
