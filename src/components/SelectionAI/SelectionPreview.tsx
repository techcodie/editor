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
      className={`fixed left-[var(--selection-ai-left)] top-[var(--selection-ai-top)] z-50 w-[25rem] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(20,20,20,0.05),0_22px_54px_-24px_rgba(20,20,20,0.42)] outline-none [animation:selection-ai-in_170ms_ease-out] focus-visible:ring-2 focus-visible:ring-indigo-500/25 ${placeAbove ? '-translate-y-full' : ''} max-sm:bottom-3 max-sm:left-3 max-sm:right-3 max-sm:top-auto max-sm:w-auto max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0`}
    >
      <header className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-3.5 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-white shadow-sm">
            <Sparkles size={15} strokeWidth={1.9} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-neutral-400">Selection AI</p>
            <h2 id="selection-ai-preview-title" className="truncate text-xs font-semibold text-neutral-950">
              {action?.label ?? 'Selection AI'}
            </h2>
          </div>
        </div>
        <button
          type="button"
          aria-label="Cancel Selection AI"
          title="Cancel"
          onClick={onCancel}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-[background-color,color,transform] duration-150 hover:bg-neutral-100 hover:text-neutral-950 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
        >
          <X size={15} strokeWidth={2} aria-hidden />
        </button>
      </header>

      {operation.status === 'loading' && (
        <div className="flex min-h-36 flex-col items-center justify-center gap-3 px-5 py-7" role="status">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
            <Loader2 size={19} className="animate-spin" aria-hidden />
          </span>
          <div className="text-center">
            <p className="text-xs font-semibold text-neutral-800">Working on your selection</p>
            <p className="mt-1 text-[11px] text-neutral-400">This usually takes a few seconds</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="mt-1 inline-flex h-7 items-center rounded-md px-2.5 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
          >
            Cancel
          </button>
        </div>
      )}

      {operation.status === 'error' && (
        <div className="bg-red-50/40 px-4 py-4">
          <p className="text-sm leading-6 text-red-700" role="alert">
            {operation.error}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={onTryAgain}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-neutral-900 px-3 text-xs font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-neutral-800 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-2"
            >
              <RefreshCw size={13} strokeWidth={2} aria-hidden />
              Try Again
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-neutral-600 transition-colors hover:bg-red-100/70 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {operation.status === 'success' && (
        <>
          <div className="max-h-72 overflow-y-auto whitespace-pre-wrap bg-[#fafaf9] px-4 py-4 text-sm leading-6 text-neutral-700">
            {operation.result}
          </div>
          <footer className="flex flex-wrap items-center gap-1.5 border-t border-neutral-200 bg-white p-2.5">
            <button
              type="button"
              onClick={onReplace}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-neutral-900 px-3 text-xs font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-neutral-800 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-2"
            >
              <WandSparkles size={13} strokeWidth={2} aria-hidden />
              Replace Selection
            </button>
            <button
              type="button"
              onClick={() => void copyResult()}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-neutral-600 transition-[background-color,color,transform] duration-150 hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
            >
              {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
              {copied ? 'Copied' : 'Copy Result'}
            </button>
            <button
              type="button"
              onClick={onTryAgain}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-neutral-600 transition-[background-color,color,transform] duration-150 hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
            >
              <RefreshCw size={13} aria-hidden />
              Try Again
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="ml-auto inline-flex h-8 items-center rounded-md px-2.5 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
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
