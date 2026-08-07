import { AlertTriangle, HelpCircle } from 'lucide-react'
import { Dialog } from './Dialog'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  /** `danger` for destructive actions (delete, discard); `neutral` for everything else. */
  tone?: 'neutral' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Shared replacement for `window.confirm()`. The browser's native confirm
 * dialog can't be styled and breaks the editor's otherwise custom UI the
 * instant it appears — this renders on the same `Dialog` primitive as every
 * other modal instead.
 */
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'neutral',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      icon={tone === 'danger' ? AlertTriangle : HelpCircle}
      iconTone={tone === 'danger' ? 'danger' : 'accent'}
      maxWidthClassName="max-w-sm"
      bodyClassName="p-4 sm:p-5"
      footer={
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-8 rounded-md border border-neutral-200 px-3 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`h-8 rounded-md px-3 text-[11px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] ${tone === 'danger' ? 'bg-red-600 hover:bg-red-500' : 'bg-neutral-900 hover:bg-neutral-800'}`}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-xs leading-5 text-neutral-600">{description}</p>
    </Dialog>
  )
}
