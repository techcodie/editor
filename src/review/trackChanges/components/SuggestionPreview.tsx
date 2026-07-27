import type { CSSProperties } from 'react'
import { FilePenLine } from 'lucide-react'
import { getTrackChangeLabel } from '../services/trackChangeRenderer'
import type { TrackChange } from '../types/trackChange'
import type { EditorSelectionBounds } from '../../../lib/editor-api'

interface SuggestionPreviewProps {
  change: TrackChange
  bounds: EditorSelectionBounds
}
interface PreviewPosition extends CSSProperties {
  '--suggestion-preview-left': string
  '--suggestion-preview-top': string
}

export function SuggestionPreview({ change, bounds }: SuggestionPreviewProps) {
  const center = (bounds.left + bounds.right) / 2
  const left = Math.min(Math.max(center, 140), window.innerWidth - 140)
  const style: PreviewPosition = {
    '--suggestion-preview-left': `${left}px`,
    '--suggestion-preview-top': `${bounds.top - 8}px`,
  }

  return (
    <div
      role="tooltip"
      style={style}
      className="pointer-events-none fixed left-[var(--suggestion-preview-left)] top-[var(--suggestion-preview-top)] z-50 w-64 -translate-x-1/2 -translate-y-full rounded-lg border border-neutral-200 bg-white p-3 shadow-[var(--document-editor-shadow-overlay)] [animation:selection-ai-in_120ms_ease-out]"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-700">
          <FilePenLine size={14} strokeWidth={2} aria-hidden />
        </span>
        <span className="min-w-0 truncate text-xs font-semibold text-neutral-900">
          {getTrackChangeLabel(change)}
        </span>
        <span className="ml-auto text-[10px] capitalize text-neutral-400">
          {change.status}
        </span>
      </div>
      <p className="mt-2 line-clamp-3 text-xs leading-5 text-neutral-700">
        {change.after || change.before || 'Formatting change'}
      </p>
    </div>
  )
}
