import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock3, Download, LoaderCircle, Plus, Search, X } from 'lucide-react'
import type { DocumentComparison } from '../../comparison/types/comparison'
import type { EditorApi } from '../../lib/editor-api'
import { useHistory } from '../hooks/useHistory'
import { createHistoryStorage } from '../services/historyStorage'
import { filterVersions, groupVersions } from '../services/versionManager'
import type { HistoryFilter, HistorySort } from '../types/history'
import type { Version, VersionAuthor } from '../types/version'
import { HistoryDiffViewer } from './HistoryDiffViewer'
import { RestoreDialog } from './RestoreDialog'
import { VersionTimeline } from './VersionTimeline'

interface HistoryPanelProps {
  isOpen: boolean
  api: EditorApi | null
  author: VersionAuthor
  storageNamespace: string
  onClose: () => void
  onCountChange: (count: number) => void
  onOpenComparison: (comparison: DocumentComparison) => void
}

export function HistoryPanel({ isOpen, api, author, storageNamespace, onClose, onCountChange, onOpenComparison }: HistoryPanelProps) {
  const panelRef = useRef<HTMLElement>(null)
  const storage = useMemo(() => createHistoryStorage(storageNamespace), [storageNamespace])
  const history = useHistory({ api, storage, author })
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const [sort, setSort] = useState<HistorySort>('newest')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [reason, setReason] = useState('')
  const [comments, setComments] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [comparison, setComparison] = useState<DocumentComparison | null>(null)
  const [comparisonSource, setComparisonSource] = useState<Version | null>(null)
  const [comparisonTargetId, setComparisonTargetId] = useState('current')
  const [comparing, setComparing] = useState(false)
  const [restoreVersion, setRestoreVersion] = useState<Version | null>(null)
  const [restoreComparison, setRestoreComparison] = useState<DocumentComparison | null>(null)
  const visible = useMemo(() => filterVersions(history.versions, query, filter, sort), [filter, history.versions, query, sort])
  const groups = useMemo(() => groupVersions(visible), [visible])

  useEffect(() => { onCountChange(history.versions.length) }, [history.versions.length, onCountChange])
  useEffect(() => {
    if (!isOpen) return
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>('[aria-label="Close version history"]')?.focus())
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !restoreVersion) { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab' || !panelRef.current || restoreVersion) return
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      const first = focusable[0]; const last = focusable[focusable.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [isOpen, onClose, restoreVersion])
  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(null), 3200)
    return () => window.clearTimeout(timeout)
  }, [notice])

  if (!isOpen) return null

  const saveSnapshot = async () => {
    const saved = await history.saveSnapshot({ name, description, reason, comments })
    if (!saved) return
    setName(''); setDescription(''); setReason(''); setComments(''); setCreating(false); setSelectedId(saved.id); setNotice('Snapshot saved to this document’s history.')
  }
  const showComparison = async (version: Version, targetId = 'current') => {
    setComparing(true); setComparisonSource(version); setComparisonTargetId(targetId)
    const target = history.versions.find((item) => item.id === targetId)
    const result = target ? await history.compareSaved(version, target) : await history.compareToCurrent(version)
    setComparison(result); setComparing(false)
  }
  const previewRestore = async (version: Version) => {
    setRestoreVersion(version); setRestoreComparison(null)
    setRestoreComparison(await history.compareToCurrent(version))
  }
  const confirmRestore = async () => {
    if (!restoreVersion) return
    const restored = await history.restore(restoreVersion)
    if (!restored) return
    setRestoreVersion(null); setRestoreComparison(null); setNotice('Version restored. A recovery snapshot was saved first.')
  }

  return (
    <>
      <button type="button" aria-label="Close version history" onClick={onClose} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] lg:hidden" />
      <aside ref={panelRef} id="history-panel" role="dialog" aria-modal="true" aria-labelledby="history-panel-title" className="history-panel fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-hidden border-l border-neutral-200 bg-white shadow-[var(--document-editor-shadow-overlay)] [animation:review-sidebar-in_180ms_ease-out] sm:max-w-[29rem] lg:sticky lg:top-6 lg:z-30 lg:h-[calc(100vh-3rem)] lg:w-[28rem] lg:rounded-lg lg:border">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 px-4"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-700"><Clock3 size={16} aria-hidden /></span><div className="min-w-0"><h2 id="history-panel-title" className="truncate text-sm font-semibold text-neutral-950">Version history</h2><p className="text-[10px] text-neutral-500">{history.versions.length} saved snapshot{history.versions.length === 1 ? '' : 's'}</p></div><button type="button" onClick={history.exportTimeline} disabled={history.versions.length === 0} aria-label="Export version timeline" title="Export timeline" className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><Download size={14} aria-hidden /></button><button type="button" onClick={onClose} aria-label="Close version history" className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><X size={15} aria-hidden /></button></header>
        {(notice || history.error) && <p role="status" className={`border-b px-4 py-2 text-[10px] ${history.error ? 'border-red-100 bg-red-50 text-red-700' : 'border-emerald-100 bg-emerald-50 text-emerald-800'}`}>{history.error ?? notice}</p>}
        {comparison && comparisonSource ? (
          <HistoryDiffViewer comparison={comparison} sourceVersion={comparisonSource} versions={history.versions} targetId={comparisonTargetId} onTargetChange={(targetId) => void showComparison(comparisonSource, targetId)} onExport={() => history.exportComparison(comparison)} onOpenFull={() => { setComparison(null); setComparisonSource(null); onOpenComparison(comparison) }} onClose={() => { setComparison(null); setComparisonSource(null) }} />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-neutral-200 p-3">
              {creating ? <div className="space-y-2 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3"><label className="block"><span className="text-[9px] font-semibold text-neutral-600">Version name</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength={120} placeholder={`Version ${history.versions.length + 1}`} className="mt-1 h-8 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-[11px] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15" /></label><label className="block"><span className="text-[9px] font-semibold text-neutral-600">Description</span><input value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} placeholder="What changed?" className="mt-1 h-8 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-[11px] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15" /></label><div className="grid grid-cols-2 gap-2"><label><span className="text-[9px] font-semibold text-neutral-600">Reason</span><input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={240} placeholder="Review, milestone…" className="mt-1 h-8 w-full rounded-md border border-neutral-200 bg-white px-2 text-[10px] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15" /></label><label><span className="text-[9px] font-semibold text-neutral-600">Audit comments</span><input value={comments} onChange={(event) => setComments(event.target.value)} maxLength={1000} placeholder="Optional note" className="mt-1 h-8 w-full rounded-md border border-neutral-200 bg-white px-2 text-[10px] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15" /></label></div><div className="flex justify-end gap-1.5 pt-1"><button type="button" onClick={() => setCreating(false)} disabled={history.saving} className="h-8 rounded-md px-3 text-[10px] font-semibold text-neutral-600 hover:bg-white disabled:opacity-40">Cancel</button><button type="button" onClick={() => void saveSnapshot()} disabled={history.saving} className="flex h-8 items-center gap-1.5 rounded-md bg-neutral-900 px-3 text-[10px] font-semibold text-white hover:bg-neutral-800 disabled:opacity-40">{history.saving && <LoaderCircle size={12} className="animate-spin" aria-hidden />}Save snapshot</button></div></div> : <button type="button" onClick={() => setCreating(true)} disabled={!api} className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-neutral-900 text-[11px] font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"><Plus size={14} aria-hidden />Create snapshot</button>}
              <div className="relative mt-3"><Search size={13} className="pointer-events-none absolute left-2.5 top-2.5 text-neutral-400" aria-hidden /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, author, reason…" aria-label="Search version history" className="h-8 w-full rounded-md border border-neutral-200 pl-8 pr-2.5 text-[10px] outline-none placeholder:text-neutral-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15" /></div>
              <div className="mt-2 grid grid-cols-2 gap-2"><select value={filter} onChange={(event) => setFilter(event.target.value as HistoryFilter)} aria-label="Filter versions" className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-[10px] text-neutral-600 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"><option value="all">All versions</option><option value="bookmarked">Bookmarks</option><option value="favorites">Favourites</option><option value="manual">Manual</option><option value="workflow">Workflow</option><option value="contract">Contract</option><option value="writing">Writing</option><option value="recovery">Recovery</option></select><select value={sort} onChange={(event) => setSort(event.target.value as HistorySort)} aria-label="Sort versions" className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-[10px] text-neutral-600 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name</option></select></div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{!history.loaded ? <div className="flex h-48 items-center justify-center" role="status"><LoaderCircle size={18} className="animate-spin text-neutral-400" aria-hidden /><span className="sr-only">Loading version history</span></div> : comparing ? <div className="flex h-48 items-center justify-center gap-2 text-[10px] text-neutral-500" role="status"><LoaderCircle size={15} className="animate-spin" aria-hidden />Comparing versions</div> : <VersionTimeline groups={groups} selectedId={selectedId} busy={history.saving} onSelect={setSelectedId} onUpdate={(version, patch) => void history.update(version.id, patch)} onCompare={(version) => void showComparison(version)} onRestore={(version) => void previewRestore(version)} onExport={(version) => void history.exportVersion(version)} onDelete={(version) => { if (window.confirm(`Delete “${version.name}”? This cannot be undone.`)) void history.remove(version.id) }} />}</div>
          </div>
        )}
      </aside>
      {restoreVersion && <RestoreDialog version={restoreVersion} comparison={restoreComparison} busy={history.saving} onConfirm={() => void confirmRestore()} onCancel={() => { if (!history.saving) { setRestoreVersion(null); setRestoreComparison(null) } }} />}
    </>
  )
}
