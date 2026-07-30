import { BookOpen, ChevronDown } from 'lucide-react'
import type { DocumentViewMode } from '../types/viewer'
import { DOCUMENT_VIEW_MODES } from '../services/viewManager'

interface ViewSwitcherProps {
  mode: DocumentViewMode
  onChange: (mode: DocumentViewMode) => void
  compact?: boolean
}

export function ViewSwitcher({ mode, onChange, compact = false }: ViewSwitcherProps) {
  return (
    <div className="relative shrink-0">
      <label htmlFor={compact ? 'document-view-mobile' : 'document-view-desktop'} className="sr-only">
        Document view
      </label>
      <BookOpen
        size={15}
        strokeWidth={1.9}
        className="pointer-events-none absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-neutral-500"
        aria-hidden
      />
      <select
        id={compact ? 'document-view-mobile' : 'document-view-desktop'}
        value={mode}
        onChange={(event) => onChange(event.target.value as DocumentViewMode)}
        aria-label="Document view"
        className={`${compact ? 'h-9 max-w-[8.75rem]' : 'h-10 max-w-[10.5rem]'} appearance-none rounded-lg border border-neutral-200 bg-white/95 py-0 pl-8 pr-7 text-xs font-semibold text-neutral-700 shadow-[var(--document-editor-shadow-surface)] outline-none transition-[border-color,background-color,color,box-shadow] hover:border-neutral-300 hover:text-neutral-950 focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500/25`}
      >
        {DOCUMENT_VIEW_MODES.map((item) => (
          <option key={item.id} value={item.id}>{item.label}</option>
        ))}
      </select>
      <ChevronDown
        size={13}
        strokeWidth={2}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
        aria-hidden
      />
    </div>
  )
}
