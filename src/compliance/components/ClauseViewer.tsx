import { LocateFixed, Quote } from 'lucide-react'
import type { ComplianceFinding } from '../types/compliance'

interface ClauseViewerProps {
  finding: ComplianceFinding
  onJump: () => void
}

export function ClauseViewer({ finding, onJump }: ClauseViewerProps) {
  return (
    <section aria-labelledby="finding-detail-title" className="border-b border-neutral-200 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div><span className="text-[9px] font-semibold uppercase text-neutral-400">{finding.type.replaceAll('-', ' ')}</span><h3 id="finding-detail-title" className="mt-1 text-sm font-semibold leading-5 text-neutral-950">{finding.title}</h3></div>
        {finding.location.quote && <button type="button" onClick={onJump} aria-label="Jump to finding in document" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><LocateFixed size={15} aria-hidden /></button>}
      </div>
      <p className="mt-2 text-[11px] leading-5 text-neutral-600">{finding.description}</p>
      {finding.location.quote && <blockquote className="mt-3 flex gap-2 border-l-2 border-indigo-300 bg-neutral-50 px-3 py-2 text-[10px] leading-4 text-neutral-600"><Quote size={12} className="mt-0.5 shrink-0 text-indigo-500" aria-hidden /><span className="line-clamp-4">{finding.location.quote}</span></blockquote>}
      <p className="mt-2 text-[10px] text-neutral-400">{finding.location.label} · {Math.round(finding.confidence * 100)}% confidence</p>
    </section>
  )
}
