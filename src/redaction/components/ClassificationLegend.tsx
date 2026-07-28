import { CLASSIFICATION_LABELS, type ClassificationLevel } from '../types/redaction'

const COLORS: Record<ClassificationLevel, string> = {
  public: 'bg-emerald-500', internal: 'bg-sky-500', confidential: 'bg-amber-500',
  restricted: 'bg-orange-600', 'highly-confidential': 'bg-red-600',
}

export function ClassificationLegend() {
  return <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800" aria-label="Classification legend">{Object.entries(CLASSIFICATION_LABELS).map(([level, label]) => <span key={level} className="flex min-w-0 items-center gap-1.5 text-[9px] text-neutral-500 dark:text-neutral-400"><i className={`h-1.5 w-1.5 shrink-0 rounded-full ${COLORS[level as ClassificationLevel]}`} aria-hidden /><span className="truncate">{label}</span></span>)}</div>
}
