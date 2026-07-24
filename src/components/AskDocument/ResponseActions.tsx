import {
  Check,
  CircleAlert,
  Copy,
  ExternalLink,
  RefreshCw,
  Rows3,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { EditorInsertionFeedback } from '../../editor/hooks/useEditorInsertion'
import { InsertionMenu } from './InsertionMenu'

interface ResponseActionsProps {
  content: string
  canInsert: boolean
  canReplaceSelection: boolean
  canRegenerate: boolean
  hasPreviewableSource: boolean
  previewSourceName?: string
  isEvidenceVisible: boolean
  insertionFeedback: EditorInsertionFeedback | null
  onInsertAtCursor: () => void
  onReplaceSelection: () => void
  onAppendToEnd: () => void
  onRegenerate: () => void
  onToggleEvidence: () => void
  onOpenPreview: () => void
}

export function ResponseActions({
  content,
  canInsert,
  canReplaceSelection,
  canRegenerate,
  hasPreviewableSource,
  previewSourceName,
  isEvidenceVisible,
  insertionFeedback,
  onInsertAtCursor,
  onReplaceSelection,
  onAppendToEnd,
  onRegenerate,
  onToggleEvidence,
  onOpenPreview,
}: ResponseActionsProps) {
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (!isCopied) return
    const timeout = window.setTimeout(() => setIsCopied(false), 1800)
    return () => window.clearTimeout(timeout)
  }, [isCopied])

  const copyResponse = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setIsCopied(true)
    } catch {
      setIsCopied(false)
    }
  }

  const actionClassName =
    'inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-1.5 text-[9px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent'

  return (
    <div className="mt-1">
      <div className="flex flex-wrap items-center gap-0.5" aria-label="Response actions">
        <InsertionMenu
          canInsert={canInsert}
          canReplaceSelection={canReplaceSelection}
          onInsertAtCursor={onInsertAtCursor}
          onReplaceSelection={onReplaceSelection}
          onAppendToEnd={onAppendToEnd}
        />
        <button type="button" onClick={copyResponse} className={actionClassName}>
          {isCopied ? (
            <Check size={10} strokeWidth={2.2} className="text-emerald-600" aria-hidden />
          ) : (
            <Copy size={10} strokeWidth={2} aria-hidden />
          )}
          {isCopied ? 'Copied' : 'Copy'}
        </button>
        <button
          type="button"
          disabled={!canRegenerate}
          onClick={onRegenerate}
          title={
            canRegenerate
              ? 'Regenerate response'
              : 'Only the latest response can be regenerated'
          }
          className={actionClassName}
        >
          <RefreshCw size={10} strokeWidth={2} aria-hidden />
          Regenerate
        </button>
        <button
          type="button"
          aria-expanded={isEvidenceVisible}
          onClick={onToggleEvidence}
          className={actionClassName}
        >
          <Rows3 size={10} strokeWidth={2} aria-hidden />
          View Sources
        </button>
        <button
          type="button"
          disabled={!hasPreviewableSource}
          onClick={onOpenPreview}
          aria-label={
            previewSourceName
              ? `Open ${previewSourceName} preview`
              : 'Open source preview'
          }
          className={actionClassName}
        >
          <ExternalLink size={10} strokeWidth={2} aria-hidden />
          Open Preview
        </button>
      </div>
      {insertionFeedback && (
        <p
          className={`mt-1 flex items-center gap-1 px-1 text-[9px] ${
            insertionFeedback.status === 'success'
              ? 'text-emerald-700'
              : 'text-red-700'
          }`}
          role={insertionFeedback.status === 'error' ? 'alert' : 'status'}
        >
          {insertionFeedback.status === 'success' ? (
            <Check size={10} strokeWidth={2.2} aria-hidden />
          ) : (
            <CircleAlert size={10} strokeWidth={2} aria-hidden />
          )}
          {insertionFeedback.message}
        </p>
      )}
    </div>
  )
}
