import type { SensitiveDataType } from '../types/detection'

export type DetectionFilter = 'all' | SensitiveDataType

export function DetectionFilters({ value, types, onChange }: { value: DetectionFilter; types: SensitiveDataType[]; onChange: (value: DetectionFilter) => void }) {
  return <label className="block border-b border-neutral-200 px-4 py-2.5 text-[9px] font-semibold uppercase text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">Finding type<select value={value} onChange={(event) => onChange(event.target.value as DetectionFilter)} className="mt-1.5 h-9 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-[11px] font-medium normal-case text-neutral-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"><option value="all">All sensitive data</option>{types.map((type) => <option key={type} value={type}>{type.replaceAll('-', ' ')}</option>)}</select></label>
}
