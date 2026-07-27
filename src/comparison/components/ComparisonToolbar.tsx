import { Columns2, FileDiff, PanelTopClose, Rows3, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { ComparisonViewMode } from '../types/comparison'

interface ComparisonToolbarControlProps {
  isActive: boolean
  onToggle: () => void
}

export function ComparisonToolbarControl({
  isActive,
  onToggle,
}: ComparisonToolbarControlProps) {
  return (
    <button
      id="comparison-trigger"
      type="button"
      onClick={onToggle}
      aria-label="Compare documents"
      aria-pressed={isActive}
      title="Compare documents"
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35',
        isActive
          ? 'bg-indigo-100 text-indigo-700 shadow-sm'
          : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950',
      )}
    >
      <FileDiff size={16} strokeWidth={1.9} aria-hidden />
    </button>
  )
}

interface ComparisonToolbarProps {
  hasComparison: boolean
  viewMode: ComparisonViewMode
  onViewModeChange: (viewMode: ComparisonViewMode) => void
  onReset: () => void
  onClose: () => void
}

export function ComparisonToolbar({
  hasComparison,
  viewMode,
  onViewModeChange,
  onReset,
  onClose,
}: ComparisonToolbarProps) {
  return (
    <header className="flex min-h-14 items-center gap-3 border-b border-neutral-200 bg-white px-3 sm:px-5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-700">
        <FileDiff size={17} strokeWidth={1.9} aria-hidden />
      </span>
      <div className="min-w-0">
        <h1 id="comparison-title" className="truncate text-sm font-semibold text-neutral-950">
          Document comparison
        </h1>
        <p className="truncate text-[11px] text-neutral-500">
          {hasComparison ? 'Change review' : 'Source documents'}
        </p>
      </div>

      {hasComparison && (
        <div
          className="ml-auto flex rounded-md border border-neutral-200 bg-neutral-100 p-0.5"
          aria-label="Comparison view"
        >
          {([
            ['split', Columns2, 'Side by side'],
            ['unified', Rows3, 'Unified'],
          ] as const).map(([mode, Icon, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChange(mode)}
              aria-pressed={viewMode === mode}
              title={label}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded px-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 sm:px-2.5',
                viewMode === mode
                  ? 'bg-white text-neutral-950 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900',
              )}
            >
              <Icon size={14} strokeWidth={1.9} aria-hidden />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      )}

      {hasComparison && (
        <button
          type="button"
          onClick={onReset}
          title="New comparison"
          aria-label="New comparison"
          className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 sm:ml-0"
        >
          <PanelTopClose size={16} strokeWidth={1.9} aria-hidden />
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close comparison"
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35',
          !hasComparison && 'ml-auto',
        )}
      >
        <X size={17} strokeWidth={2} aria-hidden />
      </button>
    </header>
  )
}
