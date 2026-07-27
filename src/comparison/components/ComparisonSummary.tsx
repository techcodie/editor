import { ArrowDownRight, ArrowUpRight, FileDiff, TextCursorInput } from 'lucide-react'
import type { ComparisonStatistics, ComparisonSummaryData } from '../types/comparison'

interface ComparisonSummaryProps {
  summary: ComparisonSummaryData
  statistics: ComparisonStatistics
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value)
}

export function ComparisonSummary({ summary, statistics }: ComparisonSummaryProps) {
  const metrics = [
    { label: 'Insertions', value: statistics.insertions, tone: 'text-emerald-700' },
    { label: 'Deletions', value: statistics.deletions, tone: 'text-red-700' },
    { label: 'Replacements', value: statistics.replacements, tone: 'text-amber-700' },
    { label: 'Formatting', value: statistics.formatting, tone: 'text-blue-700' },
  ]

  return (
    <section aria-labelledby="comparison-summary-title" className="border-b border-neutral-200 bg-neutral-50/80 px-3 py-3 sm:px-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex min-w-52 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700 shadow-sm">
            <FileDiff size={17} strokeWidth={1.9} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id="comparison-summary-title" className="text-xs font-semibold text-neutral-950">
              {summary.title}
            </h2>
            <p className="mt-0.5 truncate text-[11px] text-neutral-500">{summary.description}</p>
          </div>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-px overflow-hidden rounded-md border border-neutral-200 bg-neutral-200 sm:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="bg-white px-3 py-2">
              <span className="block text-[10px] font-medium text-neutral-500">{metric.label}</span>
              <strong className={`mt-0.5 block text-sm tabular-nums ${metric.tone}`}>{metric.value}</strong>
            </div>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-4 rounded-md border border-neutral-200 bg-white px-3 py-2 text-[10px] text-neutral-500">
          <span className="inline-flex items-center gap-1.5" title="Word count difference">
            <TextCursorInput size={13} aria-hidden />
            <strong className="font-semibold tabular-nums text-neutral-800">{signed(statistics.wordCountDifference)}</strong> words
          </span>
          <span className="inline-flex items-center gap-1.5" title="Character difference">
            {statistics.characterDifference >= 0 ? <ArrowUpRight size={13} aria-hidden /> : <ArrowDownRight size={13} aria-hidden />}
            <strong className="font-semibold tabular-nums text-neutral-800">{signed(statistics.characterDifference)}</strong> chars
          </span>
          <span title="Estimated reading-time difference">
            <strong className="font-semibold tabular-nums text-neutral-800">{signed(statistics.estimatedReadingDifference)}</strong> min
          </span>
        </div>
      </div>
    </section>
  )
}
