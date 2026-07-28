import type { WritingAnalysis } from '../types/writing'

function scoreTone(score: number) {
  if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-900'
  if (score >= 70) return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/30 dark:border-blue-900'
  if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-900'
  return 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/30 dark:border-red-900'
}

export function WritingScore({ analysis }: { analysis: WritingAnalysis }) {
  const metrics = [
    ['Correctness', analysis.scoreBreakdown.correctness],
    ['Clarity', analysis.scoreBreakdown.clarity],
    ['Engagement', analysis.scoreBreakdown.engagement],
    ['Delivery', analysis.scoreBreakdown.delivery],
  ] as const
  return (
    <section className="p-4" aria-labelledby="writing-score-title">
      <div className="flex items-center gap-4">
        <div className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg border ${scoreTone(analysis.score)}`}>
          <strong className="text-2xl font-semibold tabular-nums">{analysis.score}</strong>
          <span className="text-[8px] font-semibold uppercase">Writing score</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 id="writing-score-title" className="text-xs font-semibold text-neutral-950 dark:text-neutral-100">Document quality</h3>
          <p className="mt-1 text-[10px] leading-4 text-neutral-500">Based on correctness, clarity, engagement, and delivery.</p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[8px] text-neutral-500">
            <span>{analysis.wordCount} words</span><span aria-hidden>·</span>
            <span>{analysis.sentenceCount} sentences</span><span aria-hidden>·</span>
            <span>{analysis.paragraphCount} paragraphs</span>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {metrics.map(([label, value]) => (
          <div key={label}>
            <div className="flex justify-between text-[9px] text-neutral-500"><span>{label}</span><span className="tabular-nums">{value}</span></div>
            <div className="mt-1 h-1 rounded-full bg-neutral-100 dark:bg-neutral-800"><div className="h-full rounded-full bg-neutral-800 dark:bg-neutral-300" style={{ width: `${value}%` }} /></div>
          </div>
        ))}
      </div>
    </section>
  )
}
