import { Code2, FileText, FileType2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { ExportFormat } from '../types/export'

interface FormatSelectorProps {
  value: ExportFormat
  onChange: (format: ExportFormat) => void
}

const FORMATS = [
  { value: 'pdf', label: 'PDF', description: 'Fixed layout', Icon: FileText },
  { value: 'docx', label: 'DOCX', description: 'Editable document', Icon: FileType2 },
  { value: 'html', label: 'HTML', description: 'Self-contained', Icon: Code2 },
] as const

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100">
        Format
      </legend>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {FORMATS.map(({ value: format, label, description, Icon }) => (
          <button
            key={format}
            type="button"
            aria-pressed={value === format}
            onClick={() => onChange(format)}
            className={cn(
              'flex min-h-20 flex-col items-center justify-center rounded-md border px-2 text-center transition-[border-color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35',
              value === format
                ? 'border-indigo-300 bg-indigo-50 text-indigo-800 shadow-sm dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-200'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800',
            )}
          >
            <Icon size={18} strokeWidth={1.8} aria-hidden />
            <span className="mt-1.5 text-[11px] font-semibold">{label}</span>
            <span className="mt-0.5 text-[9px] opacity-70">{description}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
