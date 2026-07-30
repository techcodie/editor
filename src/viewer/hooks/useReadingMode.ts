import { useEffect } from 'react'
import type { EditorApi } from '../../lib/editor-api'

interface UseReadingModeOptions {
  api: EditorApi | null
  active: boolean
  keyboardShortcuts: boolean
  onToggle: () => void
}

export function useReadingMode({
  api,
  active,
  keyboardShortcuts,
  onToggle,
}: UseReadingModeOptions): void {
  useEffect(() => {
    if (!api || !active) return
    api.setPrintPreviewMode(true)
    return () => api.setPrintPreviewMode(false)
  }, [active, api])

  useEffect(() => {
    if (!keyboardShortcuts) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLocaleLowerCase() !== 'r' ||
        !(event.metaKey || event.ctrlKey) ||
        !event.shiftKey ||
        event.altKey
      ) return
      event.preventDefault()
      onToggle()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [keyboardShortcuts, onToggle])
}
