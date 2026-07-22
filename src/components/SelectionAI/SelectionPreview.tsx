import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Check, Copy, Loader2, RefreshCw, Sparkles, WandSparkles, X } from 'lucide-react'
import { SELECTION_AI_ACTIONS } from '../../../shared/ai'
import type { EditorSelectionBounds } from '../../lib/editor-api'
import type { SelectionAiOperation } from './useSelectionAi'

interface SelectionPreviewProps {
  operation: SelectionAiOperation
  bounds: EditorSelectionBounds
  onCancel: () => void
  onReplace: () => void
  onTryAgain: () => void
}

interface PreviewPosition extends CSSProperties {
  '--selection-ai-left': string
  '--selection-ai-top': string
}

export function SelectionPreview({
  operation,
  bounds,
  onCancel,
  onReplace,
  onTryAgain,
}: SelectionPreviewProps) {
  const [copied, setCopied] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const copyResetTimerRef = useRef<number | null>(null)
  const action = SELECTION_AI_ACTIONS.find(({ id }) => id === operation.action)
  const placeAbove = window.innerHeight - bounds.bottom < 390
  const center = (bounds.left + bounds.right) / 2
  const left = Math.min(Math.max(center, 200), window.innerWidth - 200)
  const style: PreviewPosition = {
    '--selection-ai-left': `${left}px`,
    '--selection-ai-top': `${placeAbove ? bounds.top - 10 : bounds.bottom + 10}px`,
  }

  useEffect(() => {
    previewRef.current?.focus()
  }, [operation.status])

  useEffect(
    () => () => {
      if (copyResetTimerRef.current !== null) window.clearTimeout(copyResetTimerRef.current)
    },
    [],
  )

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(operation.result)
      setCopied(true)
      if (copyResetTimerRef.current !== null) window.clearTimeout(copyResetTimerRef.current)
      copyResetTimerRef.current = window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div
      ref={previewRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="selection-ai-preview-title"
      tabIndex={-1}
      style={style}
      className={`fixed left-[var(--selection-ai-left)] top-[var(--selection-ai-top)] z-50 w-[24rem] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-[0_18px_50px_-20px_rgba(23,23,23,0.35)] outline-none [animation:selection-ai-in_160ms_ease-out] ${placeAbove ? '-translate-y-full' : ''} max-sm:bottom-3 max-sm:left-3 max-sm:right-3 max-sm:top-auto max-sm:w-auto max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0`}
    >
      <header className="flex items-center justify-between gap-3 border-b border-neutral-200 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
            <Sparkles size={15} strokeWidth={1.9} aria-hidden />
          </span>
          <h2 id="selection-ai-preview-title" className="truncate text-xs font-semibold text-neutral-900">
            {action?.label ?? 'Selection AI'}
          </h2>
        </div>
        <button
          type="button"
          aria-label="Cancel Selection AI"
          title="Cancel"
          onClick={onCancel}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
        >
          <X size={15} strokeWidth={2} aria-hidden />
        </button>
      </header>

      {operation.status === 'loading' && (
        <div className="flex min-h-28 flex-col items-center justify-center gap-3 px-4 py-6" role="status">
          <Loader2 size={20} className="animate-spin text-indigo-600" aria-hidden />
          <p className="text-xs font-medium text-neutral-600">Working on your selection...</p>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-medium text-neutral-500 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
          >
            Cancel
          </button>
        </div>
      )}

      {operation.status === 'error' && (
        <div className="px-4 py-4">
          <p className="text-sm leading-6 text-red-700" role="alert">
            {operation.error}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={onTryAgain}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-neutral-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2"
            >
              <RefreshCw size={13} strokeWidth={2} aria-hidden />
              Try Again
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {operation.status === 'success' && (
        <>
          <div className="max-h-64 overflow-y-auto whitespace-pre-wrap px-4 py-4 text-sm leading-6 text-neutral-700">
            {operation.result}
          </div>
          <footer className="flex flex-wrap items-center gap-1.5 border-t border-neutral-200 bg-neutral-50/70 p-2.5">
            <button
              type="button"
              onClick={onReplace}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-neutral-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2"
            >
              <WandSparkles size={13} strokeWidth={2} aria-hidden />
              Replace Selection
            </button>
            <button
              type="button"
              onClick={() => void copyResult()}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
            >
              {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
              {copied ? 'Copied' : 'Copy Result'}
            </button>
            <button
              type="button"
              onClick={onTryAgain}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
            >
              <RefreshCw size={13} aria-hidden />
              Try Again
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="ml-auto inline-flex h-8 items-center rounded-md px-2.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
            >
              Cancel
            </button>
          </footer>
          <span className="sr-only" aria-live="polite">
            {copied ? 'Result copied to clipboard.' : ''}
          </span>
        </>
      )}
    </div>
  )
}
