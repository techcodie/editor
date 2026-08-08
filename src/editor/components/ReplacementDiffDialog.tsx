import { useEffect, useRef } from 'react'
import type { MouseEvent } from 'react'
import { ArrowDown, Sparkles, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useOverlayStack } from '../../hooks/useOverlayStack'

interface ReplacementDiffDialogProps {
  original: string
  replacement: string
  onApply: () => void
  onCancel: () => void
}

export function ReplacementDiffDialog({
  original,
  replacement,
  onApply,
  onCancel,
}: ReplacementDiffDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef(true)
  const isTopmost = useOverlayStack(true)

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    cancelButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!isTopmost()) return
        event.preventDefault()
        onCancel()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])'),
      )
      const first = focusable[0]
      const last = focusable.at(-1)
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
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (restoreFocusRef.current) {
        const fallback = document.querySelector<HTMLElement>(
          '[aria-label="Insert response into editor"]',
        )
        if (previousFocus && previousFocus.getClientRects().length > 0) {
          previousFocus.focus()
        } else {
          fallback?.focus()
        }
      }
    }
  }, [isTopmost, onCancel])

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onCancel()
  }

  const apply = () => {
    restoreFocusRef.current = false
    onApply()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-neutral-950/35 p-3 backdrop-blur-[2px] [animation:selection-ai-in_160ms_ease-out] sm:items-center sm:p-5"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="replacement-diff-title"
        className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-[var(--document-editor-shadow-overlay)] outline-none"
      >
        <header className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-white">
              <Sparkles size={14} strokeWidth={1.9} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-neutral-500">AI replacement</p>
              <h2 id="replacement-diff-title" className="text-sm font-semibold text-neutral-950">
                Review changes
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel replacement"
            title="Cancel"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
          >
            <X size={15} strokeWidth={2} aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#fafaf9] p-4">
          <section aria-labelledby="replacement-original-title">
            <h3
              id="replacement-original-title"
              className="text-[10px] font-semibold uppercase text-neutral-500"
            >
              Original
            </h3>
            <div className="mt-1.5 max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-red-200 bg-red-50/60 px-3 py-2.5 text-xs leading-5 text-neutral-700">
              {original}
            </div>
          </section>

          <div className="flex justify-center py-2 text-neutral-400" aria-hidden>
            <ArrowDown size={15} strokeWidth={1.8} />
          </div>

          <section aria-labelledby="replacement-new-title">
            <h3
              id="replacement-new-title"
              className="text-[10px] font-semibold uppercase text-neutral-500"
            >
              Replacement
            </h3>
            <div className="mt-1.5 max-h-56 overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-emerald-200 bg-emerald-50/60 px-3 py-2.5 text-xs leading-5 text-neutral-700">
              {replacement}
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-neutral-200 bg-white p-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={apply}
            className="inline-flex h-8 items-center rounded-md bg-neutral-900 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] focus-visible:ring-offset-2"
          >
            Apply replacement
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
