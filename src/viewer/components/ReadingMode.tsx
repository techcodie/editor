import { Minimize2 } from 'lucide-react'
import type { DocumentViewMode } from '../types/viewer'
import { ViewSwitcher } from './ViewSwitcher'

interface ReadingModeProps {
  mode: DocumentViewMode
  onModeChange: (mode: DocumentViewMode) => void
  onExit: () => void
}

export function ReadingMode({ mode, onModeChange, onExit }: ReadingModeProps) {
  return (
    <header className="sticky top-3 z-30 mx-auto flex w-full max-w-[48rem] items-center gap-2 rounded-lg border border-neutral-200 bg-white/95 p-1.5 shadow-[var(--document-editor-shadow-surface)] backdrop-blur-xl sm:top-4">
      <span className="pl-2 text-xs font-semibold text-neutral-700">Reading mode</span>
      <div className="ml-auto flex items-center gap-1.5">
        <ViewSwitcher mode={mode} onChange={onModeChange} compact />
        <button
          type="button"
          onClick={onExit}
          aria-label="Exit reading mode"
          title="Exit reading mode"
          className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
        >
          <Minimize2 size={16} strokeWidth={1.9} aria-hidden />
        </button>
      </div>
    </header>
  )
}
