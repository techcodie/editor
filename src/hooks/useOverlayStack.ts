import { useCallback, useEffect, useState } from 'react'
import { isTopmostOverlay, popOverlay, pushOverlay } from '../lib/overlayStack'

/**
 * Registers this component instance on the shared overlay stack while
 * `active` is true. Returns a stable function that reports whether this
 * instance is currently the front-most registered overlay — call it from
 * inside an Escape handler so only the surface actually on top responds,
 * instead of every simultaneously-mounted dismissible surface reacting to
 * one keypress. The returned function's identity never changes, so it's
 * safe to include in a `useEffect` dependency array without re-running that
 * effect on every render.
 */
export function useOverlayStack(active: boolean): () => boolean {
  const [id] = useState<symbol>(() => Symbol('overlay'))

  useEffect(() => {
    if (!active) return
    pushOverlay(id)
    return () => popOverlay(id)
  }, [active, id])

  return useCallback(() => isTopmostOverlay(id), [id])
}
