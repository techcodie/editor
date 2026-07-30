import { useCallback, useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { EditorApi, EditorTextSelection } from '../../lib/editor-api'
import { openGoogleSearch } from '../services/viewManager'

interface GoogleSearchButtonProps {
  api: EditorApi | null
  enabled?: boolean
}

export function GoogleSearchButton({ api, enabled = true }: GoogleSearchButtonProps) {
  const [selection, setSelection] = useState<EditorTextSelection | null>(null)
  const sync = useCallback(() => setSelection(api?.getTextSelection() ?? null), [api])

  useEffect(() => {
    if (!api || !enabled) {
      setSelection(null)
      return
    }
    sync()
    const unsubscribe = api.subscribe(sync)
    window.addEventListener('scroll', sync, true)
    window.addEventListener('resize', sync)
    return () => {
      unsubscribe()
      window.removeEventListener('scroll', sync, true)
      window.removeEventListener('resize', sync)
    }
  }, [api, enabled, sync])

  if (!selection) return null
  const center = Math.min(
    Math.max((selection.bounds.left + selection.bounds.right) / 2, 86),
    window.innerWidth - 86,
  )
  const top = Math.min(
    Math.max(selection.bounds.bottom + 8, 12),
    window.innerHeight - 44,
  )
  const style = {
    '--google-search-left': `${center}px`,
    '--google-search-top': `${top}px`,
  } as CSSProperties

  return (
    <button
      type="button"
      style={style}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => openGoogleSearch(selection.text)}
      aria-label={`Search Google for selected text: ${selection.text.slice(0, 80)}`}
      className="fixed left-[var(--google-search-left)] top-[var(--google-search-top)] z-50 inline-flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-700 shadow-[var(--document-editor-shadow-overlay)] transition-[background-color,border-color,color,transform] hover:-translate-x-1/2 hover:-translate-y-px hover:border-neutral-300 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 max-sm:bottom-[8.5rem] max-sm:left-auto max-sm:right-3 max-sm:top-auto max-sm:translate-x-0 max-sm:hover:translate-x-0"
    >
      <Search size={14} strokeWidth={2} aria-hidden />
      Search Google
    </button>
  )
}
