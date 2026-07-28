import { MessagesSquare } from 'lucide-react'
import type { ToneAnalysis } from '../types/writing'

export function ToneIndicator({ tone }: { tone: ToneAnalysis }) {
  return (
    <section className="border-t border-neutral-200 p-4 dark:border-neutral-800" aria-labelledby="tone-indicator-title">
      <div className="flex items-center gap-2"><MessagesSquare size={13} className="text-neutral-400" aria-hidden /><h3 id="tone-indicator-title" className="text-[10px] font-semibold text-neutral-900 dark:text-neutral-100">Tone</h3></div>
      <div className="mt-3 flex items-center justify-between rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900">
        <div><p className="text-xs font-semibold capitalize text-neutral-900 dark:text-neutral-100">{tone.primary}</p><p className="mt-0.5 text-[8px] text-neutral-500">{tone.signals.join(' · ')}</p></div>
        <span className="rounded bg-white px-1.5 py-1 text-[8px] font-semibold tabular-nums text-neutral-600 shadow-sm dark:bg-neutral-800 dark:text-neutral-300">{Math.round(tone.confidence * 100)}%</span>
      </div>
    </section>
  )
}
