import { Eye } from 'lucide-react'
import { renderRedactionPreview } from '../services/redactionRenderer'
import type { RedactionRecord } from '../types/redaction'

export function RedactionPreview({ text, records }: { text: string; records: RedactionRecord[] }) {
  const segments = renderRedactionPreview(text, records)
  const count = records.filter((record) => record.decision === 'approved').length
  return <section className="p-4" aria-label="Sanitized document preview"><div className="mb-3 flex items-center gap-2"><Eye size={14} className="text-indigo-600" aria-hidden /><h3 className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100">Export preview</h3><span className="ml-auto text-[9px] text-neutral-400">{count} approved</span></div>{count ? <div className="max-h-[28rem] overflow-y-auto whitespace-pre-wrap rounded-md border border-neutral-200 bg-neutral-50 p-4 font-mono text-[10px] leading-5 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">{segments.map((segment, index) => segment.redacted ? <mark key={`${segment.recordId}:${index}`} className="rounded-sm bg-neutral-900 px-0.5 text-white dark:bg-white dark:text-neutral-950">{segment.text}</mark> : <span key={index}>{segment.text}</span>)}</div> : <p className="rounded-md border border-dashed border-neutral-200 px-5 py-10 text-center text-[10px] leading-4 text-neutral-400 dark:border-neutral-800">Approve redactions to preview the sanitized export copy.</p>}</section>
}
