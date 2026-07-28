import { PenLine } from 'lucide-react'

interface SignaturePlaceholderProps { label: string; compact?: boolean }

export function SignaturePlaceholder({ label, compact = false }: SignaturePlaceholderProps) {
  return (
    <div className={`mt-2 flex items-end gap-2 border-b border-neutral-400 pb-1 text-neutral-400 ${compact ? 'max-w-32' : 'max-w-sm'}`}>
      <PenLine size={14} className="mb-0.5 shrink-0" aria-hidden />
      <span className="truncate text-[11px] italic">{label}</span>
    </div>
  )
}
