import { RotateCcw } from 'lucide-react'
import { Dialog } from '../../components/ui/Dialog'
import type { RedactionRecord } from '../types/redaction'

export function RestoreDialog({ record, onConfirm, onClose }: { record: RedactionRecord | null; onConfirm: () => void; onClose: () => void }) {
  if (!record) return null
  return (
    <Dialog
      isOpen
      onClose={onClose}
      title="Restore original visibility?"
      subtitle="The document itself was never changed."
      icon={RotateCcw}
      iconTone="accent"
      maxWidthClassName="max-w-sm"
      footer={
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-md border border-neutral-200 px-3 text-[10px] font-semibold text-neutral-600 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-8 rounded-md bg-neutral-900 px-3 text-[10px] font-semibold text-white hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
          >
            Restore
          </button>
        </div>
      }
    >
      <p className="text-[10px] leading-4 text-neutral-500">
        This removes the approved export redaction and records the restore decision.
      </p>
    </Dialog>
  )
}
