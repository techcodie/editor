import { ChevronRight, ListFilter } from 'lucide-react'
import { cn } from '../../lib/cn'
import type {
  ComplianceFinding,
  ComplianceSeverity,
  ComplianceSeverityFilter,
} from '../types/compliance'

interface RiskSidebarProps {
  findings: ComplianceFinding[]
  selectedId: string | null
  filter: ComplianceSeverityFilter
  onFilterChange: (filter: ComplianceSeverityFilter) => void
  onSelect: (finding: ComplianceFinding) => void
}

const severityDot: Record<ComplianceSeverity, string> = {
  low: 'bg-emerald-500', medium: 'bg-amber-500', high: 'bg-orange-500', critical: 'bg-red-600',
}

export function RiskSidebar({ findings, selectedId, filter, onFilterChange, onSelect }: RiskSidebarProps) {
  const visible = filter === 'all' ? findings : findings.filter((finding) => finding.severity === filter)
  return (
    <section aria-label="Compliance findings" className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-neutral-200 px-3 py-2" role="toolbar" aria-label="Filter findings by severity">
        <ListFilter size={13} className="mr-1 shrink-0 text-neutral-400" aria-hidden />
        {(['all', 'critical', 'high', 'medium', 'low'] as const).map((item) => (
          <button key={item} type="button" aria-pressed={filter === item} onClick={() => onFilterChange(item)} className={cn('h-7 shrink-0 rounded px-2 text-[10px] font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]', filter === item ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900')}>{item}</button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {visible.length === 0 ? (
          <div className="px-5 py-10 text-center"><p className="text-xs font-medium text-neutral-700">No matching findings</p><p className="mt-1 text-[11px] text-neutral-500">Choose another severity filter.</p></div>
        ) : visible.map((finding) => (
          <button key={finding.id} type="button" aria-current={selectedId === finding.id ? 'true' : undefined} onClick={() => onSelect(finding)} className={cn('mb-1 flex w-full items-start gap-2.5 rounded-md px-2.5 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]', selectedId === finding.id ? 'bg-indigo-50 text-indigo-950' : 'hover:bg-neutral-50')}>
            <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', severityDot[finding.severity])} aria-hidden />
            <span className="min-w-0 flex-1"><strong className="block truncate text-[11px] font-semibold">{finding.title}</strong><span className="mt-0.5 block truncate text-[10px] text-neutral-500">{finding.location.label} · {Math.round(finding.confidence * 100)}%</span></span>
            <ChevronRight size={13} className="mt-1 shrink-0 text-neutral-400" aria-hidden />
          </button>
        ))}
      </div>
    </section>
  )
}
