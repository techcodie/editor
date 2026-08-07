import { useEffect, useState } from 'react'
import { LoaderCircle, RotateCcw, ShieldCheck } from 'lucide-react'
import { Dialog } from '../../components/ui/Dialog'
import { UnifiedViewer } from '../../comparison/components/UnifiedViewer'
import type { DocumentComparison } from '../../comparison/types/comparison'
import type { Version } from '../types/version'

interface RestoreDialogProps {
  version: Version
  comparison: DocumentComparison | null
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function RestoreDialog({ version, comparison, busy, onConfirm, onCancel }: RestoreDialogProps) {
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null)
  useEffect(() => { setSelectedChangeId(comparison?.changes[0]?.id ?? null) }, [comparison])

  return (
    <Dialog
      isOpen
      onClose={onCancel}
      disableClose={busy}
      title={`Restore ${version.name}`}
      subtitle="Preview changes before restoring"
      icon={RotateCcw}
      iconTone="accent"
      maxWidthClassName="max-w-2xl"
      bodyClassName="flex min-h-64 flex-col overflow-hidden"
      footer={
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-9 rounded-md px-3 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || !comparison}
            className="flex h-9 items-center gap-2 rounded-md bg-neutral-900 px-4 text-[11px] font-semibold text-white hover:bg-neutral-800 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
          >
            {busy && <LoaderCircle size={13} className="animate-spin" aria-hidden />}
            Restore version
          </button>
        </div>
      }
    >
      <div className="flex flex-1 flex-col overflow-hidden bg-neutral-50">
        {comparison ? (
          <UnifiedViewer
            segments={comparison.segments}
            changes={comparison.changes}
            selectedChangeId={selectedChangeId}
            onSelectChange={setSelectedChangeId}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center" role="status">
            <LoaderCircle size={20} className="animate-spin text-neutral-400" aria-hidden />
            <span className="sr-only">Preparing version preview</span>
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-start gap-2 border-t border-emerald-100 bg-emerald-50 px-4 py-2.5 text-[10px] leading-4 text-emerald-800">
        <ShieldCheck size={13} className="mt-0.5 shrink-0" aria-hidden />
        <p>Your current document will be saved as a recovery snapshot before this version is restored.</p>
      </div>
    </Dialog>
  )
}
