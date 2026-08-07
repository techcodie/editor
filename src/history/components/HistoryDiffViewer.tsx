import { useState } from 'react'
import { Download, ExternalLink, GitCompareArrows, X } from 'lucide-react'
import { UnifiedViewer } from '../../comparison/components/UnifiedViewer'
import type { DocumentComparison } from '../../comparison/types/comparison'
import type { Version } from '../types/version'

interface HistoryDiffViewerProps {
  comparison: DocumentComparison
  sourceVersion: Version
  versions: Version[]
  targetId: string
  onTargetChange: (targetId: string) => void
  onExport: () => void
  onOpenFull: () => void
  onClose: () => void
}

export function HistoryDiffViewer({ comparison, sourceVersion, versions, targetId, onTargetChange, onExport, onOpenFull, onClose }: HistoryDiffViewerProps) {
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(comparison.changes[0]?.id ?? null)
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-white" aria-label="Version comparison preview">
      <header className="shrink-0 border-b border-neutral-200 p-3">
        <div className="flex items-center gap-2"><GitCompareArrows size={15} className="text-indigo-600" aria-hidden /><div className="min-w-0"><h3 className="truncate text-xs font-semibold text-neutral-950">{sourceVersion.name}</h3><p className="text-[9px] text-neutral-500">{comparison.changes.length} change{comparison.changes.length === 1 ? '' : 's'}</p></div><button type="button" onClick={onClose} aria-label="Close comparison preview" className="ml-auto flex h-7 w-7 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"><X size={13} aria-hidden /></button></div>
        <label className="mt-2 block"><span className="sr-only">Compare with</span><select value={targetId} onChange={(event) => onTargetChange(event.target.value)} className="h-8 w-full rounded-md border border-neutral-200 bg-white px-2 text-[10px] text-neutral-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"><option value="current">Current document</option>{versions.filter((version) => version.id !== sourceVersion.id).map((version) => <option key={version.id} value={version.id}>{version.name}</option>)}</select></label>
      </header>
      <div className="min-h-0 flex-1"><UnifiedViewer key={comparison.id} segments={comparison.segments} changes={comparison.changes} selectedChangeId={selectedChangeId} onSelectChange={setSelectedChangeId} /></div>
      <footer className="grid shrink-0 grid-cols-2 gap-2 border-t border-neutral-200 p-3"><button type="button" onClick={onExport} className="flex h-8 items-center justify-center gap-1.5 rounded-md border border-neutral-200 text-[10px] font-semibold text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"><Download size={12} aria-hidden />Export</button><button type="button" onClick={onOpenFull} className="flex h-8 items-center justify-center gap-1.5 rounded-md bg-neutral-900 text-[10px] font-semibold text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"><ExternalLink size={12} aria-hidden />Full comparison</button></footer>
    </section>
  )
}
