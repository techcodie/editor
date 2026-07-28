import { CheckCircle2, LoaderCircle, TriangleAlert } from 'lucide-react'
import type { SearchProgress } from '../types/search'

export function EmbeddingStatus({ progress }: { progress: SearchProgress }) {
  const working = !['idle', 'ready', 'error'].includes(progress.stage)
  const Icon = progress.stage === 'error' ? TriangleAlert : working ? LoaderCircle : CheckCircle2
  return (
    <div className="flex items-center gap-2 text-[10px] text-neutral-500" role="status" aria-live="polite">
      <Icon size={12} className={working ? 'animate-spin text-indigo-600' : progress.stage === 'error' ? 'text-red-600' : 'text-emerald-600'} aria-hidden />
      <span className="truncate">{progress.message}</span>
      {progress.stage === 'embedding' && (
        <span className="ml-auto tabular-nums">{progress.indexed}/{progress.total}</span>
      )}
    </div>
  )
}
