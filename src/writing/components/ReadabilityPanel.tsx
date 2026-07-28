import { BookOpenText, Clock3 } from 'lucide-react'
import type { ReadabilityMetrics } from '../types/writing'

function label(value: string) { return value.replaceAll('-', ' ') }

export function ReadabilityPanel({ readability }: { readability: ReadabilityMetrics }) {
  return (
    <section className="border-t border-neutral-200 p-4 dark:border-neutral-800" aria-labelledby="readability-title">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><BookOpenText size={13} className="text-neutral-400" aria-hidden /><h3 id="readability-title" className="text-[10px] font-semibold text-neutral-900 dark:text-neutral-100">Readability</h3></div><span className="text-xs font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{readability.score}/100</span></div>
      <dl className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-neutral-200 p-2.5 dark:border-neutral-800"><dt className="text-[8px] text-neutral-500">Reading level</dt><dd className="mt-1 text-[10px] font-semibold capitalize text-neutral-900 dark:text-neutral-100">{label(readability.level)}</dd></div>
        <div className="rounded-md border border-neutral-200 p-2.5 dark:border-neutral-800"><dt className="flex items-center gap-1 text-[8px] text-neutral-500"><Clock3 size={10} aria-hidden />Reading time</dt><dd className="mt-1 text-[10px] font-semibold text-neutral-900 dark:text-neutral-100">{readability.estimatedReadingMinutes} min</dd></div>
        <div className="rounded-md border border-neutral-200 p-2.5 dark:border-neutral-800"><dt className="text-[8px] text-neutral-500">Sentence complexity</dt><dd className="mt-1 text-[10px] font-semibold capitalize text-neutral-900 dark:text-neutral-100">{readability.sentenceComplexity} · {readability.averageSentenceWords} words</dd></div>
        <div className="rounded-md border border-neutral-200 p-2.5 dark:border-neutral-800"><dt className="text-[8px] text-neutral-500">Paragraph complexity</dt><dd className="mt-1 text-[10px] font-semibold capitalize text-neutral-900 dark:text-neutral-100">{readability.paragraphComplexity} · {readability.averageParagraphWords} words</dd></div>
      </dl>
    </section>
  )
}
