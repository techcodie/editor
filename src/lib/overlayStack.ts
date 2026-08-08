/**
 * Tracks which mounted dismissible surfaces (dialogs, popovers, floating
 * panels) are currently open, front-most last. Several such surfaces each
 * own an independent `window.addEventListener('keydown', ...)` Escape
 * handler; without this, two surfaces mounted at once both react to the
 * same Escape press instead of only the one actually on top. This module
 * only arbitrates "am I the front-most open surface" — each surface still
 * owns its own dismissal logic and keydown listener.
 */
export type OverlayId = symbol

const stack: OverlayId[] = []

export function pushOverlay(id: OverlayId): void {
  if (!stack.includes(id)) stack.push(id)
}

export function popOverlay(id: OverlayId): void {
  const index = stack.indexOf(id)
  if (index !== -1) stack.splice(index, 1)
}

export function isTopmostOverlay(id: OverlayId): boolean {
  return stack.length > 0 && stack[stack.length - 1] === id
}
