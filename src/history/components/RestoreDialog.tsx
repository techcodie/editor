import { useEffect, useRef, useState } from 'react'
import { LoaderCircle, RotateCcw, ShieldCheck, X } from 'lucide-react'
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
  const dialogRef = useRef<HTMLDivElement>(null)
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null)
  useEffect(() => { setSelectedChangeId(comparison?.changes[0]?.id ?? null) }, [comparison])
  useEffect(() => {
    requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>('[aria-label="Cancel restore"]')?.focus())
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) { event.preventDefault(); onCancel(); return }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      const first = focusable[0]; const last = focusable[focusable.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [busy, onCancel])
  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-neutral-950/40 p-3 backdrop-blur-[2px]"><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="restore-version-title" className="flex max-h-[min(46rem,calc(100vh-1.5rem))] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-2xl"><header className="flex shrink-0 items-center gap-3 border-b border-neutral-200 px-4 py-3"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-700"><RotateCcw size={15} aria-hidden /></span><div className="min-w-0"><h2 id="restore-version-title" className="truncate text-sm font-semibold text-neutral-950">Restore {version.name}</h2><p className="text-[10px] text-neutral-500">Preview changes before restoring</p></div><button type="button" onClick={onCancel} disabled={busy} aria-label="Cancel restore" className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><X size={15} aria-hidden /></button></header><div className="flex min-h-64 flex-1 flex-col overflow-hidden bg-neutral-50">{comparison ? <UnifiedViewer segments={comparison.segments} changes={comparison.changes} selectedChangeId={selectedChangeId} onSelectChange={setSelectedChangeId} /> : <div className="flex flex-1 items-center justify-center" role="status"><LoaderCircle size={20} className="animate-spin text-neutral-400" aria-hidden /><span className="sr-only">Preparing version preview</span></div>}</div><div className="flex items-start gap-2 border-t border-emerald-100 bg-emerald-50 px-4 py-2.5 text-[10px] leading-4 text-emerald-800"><ShieldCheck size={13} className="mt-0.5 shrink-0" aria-hidden /><p>Your current document will be saved as a recovery snapshot before this version is restored.</p></div><footer className="flex shrink-0 justify-end gap-2 border-t border-neutral-200 px-4 py-3"><button type="button" onClick={onCancel} disabled={busy} className="h-9 rounded-md px-3 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35">Cancel</button><button type="button" onClick={onConfirm} disabled={busy || !comparison} className="flex h-9 items-center gap-2 rounded-md bg-neutral-900 px-4 text-[11px] font-semibold text-white hover:bg-neutral-800 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40">{busy && <LoaderCircle size={13} className="animate-spin" aria-hidden />}Restore version</button></footer></div></div>
}
