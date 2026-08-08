import { useEffect, useRef } from 'react'
import { useOverlayStack } from '../../hooks/useOverlayStack'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

/**
 * Consolidates the focus-trap + Escape-to-close + focus-restore behavior that
 * was previously reimplemented independently in ~17 dialogs/panels across the
 * codebase. Attach the returned ref to the trap's outer container.
 */
export function useFocusTrap<T extends HTMLElement>(
  isActive: boolean,
  onEscape?: () => void,
  initialFocusSelector?: string,
) {
  const containerRef = useRef<T>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  // Shared across every dialog/panel built on this hook: when more than one
  // is mounted at once (e.g. a confirmation dialog opened from within
  // another panel), only the front-most should close on Escape.
  const isTopmost = useOverlayStack(isActive)

  useEffect(() => {
    if (!isActive) return
    previousFocusRef.current = document.activeElement as HTMLElement | null
    const container = containerRef.current
    window.requestAnimationFrame(() => {
      const initial = initialFocusSelector
        ? container?.querySelector<HTMLElement>(initialFocusSelector)
        : container?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
      initial?.focus()
    })
    return () => previousFocusRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive])

  useEffect(() => {
    if (!isActive) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onEscape) {
        if (!isTopmost()) return
        event.preventDefault()
        onEscape()
        return
      }
      if (event.key !== 'Tab' || !containerRef.current) return
      const focusable = [...containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)]
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, isTopmost, onEscape])

  return containerRef
}
