import { Check, LoaderCircle, RotateCcw, X } from 'lucide-react'
import type { WritingRewriteResult } from '../types/writing'

interface RewritePreviewProps {
  result: WritingRewriteResult | null
  loading: boolean
  onApply: () => void
  onRetry: () => void
  onCancel: () => void
}

export function RewritePreview({ result, loading, onApply, onRetry, onCancel }: RewritePreviewProps) {
  if (loading) return <div className="m-4 flex min-h-44 flex-col items-center justify-center rounded-md border border-violet-200 bg-violet-50/50 text-center dark:border-violet-900 dark:bg-violet-950/20" role="status"><LoaderCircle size={20} className="animate-spin text-violet-600" aria-hidden /><p className="mt-3 text-[10px] font-semibold text-violet-950 dark:text-violet-100">Preparing rewrite preview</p><button type="button" onClick={onCancel} className="mt-3 h-7 rounded px-2 text-[9px] text-violet-700 hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 dark:text-violet-300 dark:hover:bg-violet-900">Cancel</button></div>
  if (!result) return null
  return <section className="m-4 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800" aria-labelledby="rewrite-preview-title"><div className="border-b border-neutral-200 bg-neutral-50 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900"><div className="flex items-center justify-between"><h3 id="rewrite-preview-title" className="text-[10px] font-semibold text-neutral-900 dark:text-neutral-100">Rewrite preview</h3><span className="text-[8px] text-neutral-400">{result.assistedByAi ? 'AI-assisted' : 'Local'}</span></div></div><div className="max-h-64 overflow-y-auto p-3"><p className="text-[9px] leading-5 text-neutral-800 dark:text-neutral-200">{result.rewrittenText}</p></div><div className="flex items-center gap-1.5 border-t border-neutral-200 p-2.5 dark:border-neutral-800"><button type="button" onClick={onCancel} className="inline-flex h-8 w-8 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 dark:hover:bg-neutral-800" aria-label="Cancel rewrite"><X size={13} aria-hidden /></button><button type="button" onClick={onRetry} className="inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-[9px] font-semibold text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 dark:hover:bg-neutral-800"><RotateCcw size={12} aria-hidden />Try again</button><button type="button" onClick={onApply} className="ml-auto inline-flex h-8 items-center gap-1.5 rounded bg-neutral-900 px-3 text-[9px] font-semibold text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:bg-white dark:text-neutral-950"><Check size={12} aria-hidden />Create suggestion</button></div></section>
}
