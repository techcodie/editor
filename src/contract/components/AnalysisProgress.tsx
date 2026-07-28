import { LoaderCircle, X } from 'lucide-react'
import type { ContractAnalysisProgress } from '../types/contract'

export function AnalysisProgress({ progress, onCancel }: { progress: ContractAnalysisProgress; onCancel: () => void }) {
  return <div className="border-b border-cyan-100 bg-cyan-50/70 px-4 py-3 dark:border-cyan-950 dark:bg-cyan-950/30" role="status" aria-live="polite"><div className="flex items-center gap-2"><LoaderCircle size={13} className="animate-spin text-cyan-700 dark:text-cyan-300" aria-hidden /><span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-cyan-950 dark:text-cyan-100">{progress.message}</span><button type="button" onClick={onCancel} aria-label="Cancel contract analysis" className="flex h-6 w-6 items-center justify-center rounded text-cyan-700 hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 dark:hover:bg-cyan-900"><X size={11} aria-hidden /></button></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-cyan-100 dark:bg-cyan-900"><div className="h-full bg-cyan-600 transition-[width] duration-300" style={{ width: `${progress.progress}%` }} /></div></div>
}
