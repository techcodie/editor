import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, LoaderCircle, MousePointer2, RefreshCw, ScanEye } from 'lucide-react'
import type { EditorApi } from '../../lib/editor-api'
import type { VersionAuthor } from '../../history/types/version'
import { PanelShell } from '../../components/ui/PanelShell'
import { useDetection } from '../hooks/useDetection'
import { useRedaction } from '../hooks/useRedaction'
import type { AiDetectionProvider, SensitiveDataDetection, SensitiveDataType } from '../types/detection'
import type { RedactionRecord } from '../types/redaction'
import type { IdentityAuditInput } from '../../identity/types/identity'
import { ClassificationLegend } from './ClassificationLegend'
import { DetectionFilters, type DetectionFilter } from './DetectionFilters'
import { DetectionResults } from './DetectionResults'
import { RedactionPreview } from './RedactionPreview'
import { RedactionReview } from './RedactionReview'
import { RestoreDialog } from './RestoreDialog'
import { SensitiveDataSidebar } from './SensitiveDataSidebar'

type RedactionView = 'detect' | 'review' | 'preview'

interface RedactionPanelProps {
  isOpen: boolean
  api: EditorApi | null
  namespace: string
  author: VersionAuthor
  aiProvider?: AiDetectionProvider
  onClose: () => void
  onRecordsChange: (records: RedactionRecord[]) => void
  onAudit?: (input: IdentityAuditInput) => void
}

export function RedactionPanel({ isOpen, api, namespace, author, aiProvider, onClose, onRecordsChange, onAudit }: RedactionPanelProps) {
  const [view, setView] = useState<RedactionView>('detect')
  const [filter, setFilter] = useState<DetectionFilter>('all')
  const [selectedDetectionId, setSelectedDetectionId] = useState<string | null>(null)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [restoreRecord, setRestoreRecord] = useState<RedactionRecord | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const detection = useDetection({ api, active: isOpen, aiProvider })
  const { cancel: cancelDetection, isDetecting } = detection
  const redaction = useRedaction({ api, namespace, author, onAudit })
  const types = useMemo(() => [...new Set(detection.detections.map((item) => item.type))].toSorted() as SensitiveDataType[], [detection.detections])
  const visibleDetections = useMemo(() => detection.detections.filter((item) => filter === 'all' || item.type === filter), [detection.detections, filter])
  const selectedRecord = redaction.records.find((record) => record.id === selectedRecordId) ?? null
  const protectedRanges = useMemo(() => new Set(redaction.records.filter((record) => record.decision !== 'restored').map((record) => `${record.detection.range.from}:${record.detection.range.to}`)), [redaction.records])

  useEffect(() => onRecordsChange(redaction.records), [onRecordsChange, redaction.records])
  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(null), 3200)
    return () => window.clearTimeout(timeout)
  }, [notice])
  const jump = (finding: SensitiveDataDetection) => {
    const selection = api?.findTextSelection(finding.value)
    setNotice(selection && api?.focusTextSelection(selection) ? 'Sensitive range selected in the document.' : 'The original range is no longer available.')
  }
  const addFinding = async (finding: SensitiveDataDetection) => {
    const record = await redaction.add(finding)
    if (!record) return
    setSelectedRecordId(record.id)
    setView('review')
    setNotice('Restore point created. Redaction is ready for review.')
  }
  const addManualSelection = async () => {
    const selection = api?.getTextSelection()
    const documentText = api?.getDocumentText() ?? ''
    if (!selection?.text.trim()) { setNotice('Select text in the editor first.'); return }
    const matches: number[] = []
    let cursor = documentText.indexOf(selection.text)
    while (cursor >= 0) {
      matches.push(cursor)
      cursor = documentText.indexOf(selection.text, cursor + 1)
    }
    const from = matches.toSorted((left, right) =>
      Math.abs(left - selection.from) - Math.abs(right - selection.from),
    )[0] ?? -1
    if (from < 0) { setNotice('The selected text could not be mapped to the document.'); return }
    await addFinding({
      id: crypto.randomUUID(), type: 'custom', label: 'Manual selection', value: selection.text,
      range: { from, to: from + selection.text.length }, confidence: 1, source: 'manual',
      reason: 'Selected manually for redaction review.',
    })
  }
  const navigateRecord = (offset: number) => {
    if (!redaction.records.length) return
    const index = Math.max(0, redaction.records.findIndex((record) => record.id === selectedRecordId))
    const next = redaction.records[(index + offset + redaction.records.length) % redaction.records.length]
    setSelectedRecordId(next.id)
    jump(next.detection)
  }

  return (
    <PanelShell
      isOpen={isOpen}
      onClose={onClose}
      onEscape={() => { if (isDetecting) cancelDetection(); else onClose() }}
      initialFocusSelector='[aria-label="Close sensitive data"]'
      title="Sensitive Data"
      subtitle="Detect, classify, review, and sanitize exports"
      icon={ScanEye}
      iconTone="accent"
      labelledById="redaction-panel-title"
      panelId="redaction-panel"
      widthClassName="sm:max-w-[30rem] lg:w-[29rem]"
      headerActions={<button type="button" onClick={() => void detection.scan(true)} disabled={detection.isDetecting} aria-label="Scan document again" title="Scan again" className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 dark:hover:bg-neutral-800 dark:hover:text-white"><RefreshCw size={14} className={detection.isDetecting ? 'animate-spin' : ''} aria-hidden /></button>}
      footer={<div className="-my-3 py-2.5"><div className="flex items-center justify-between text-[9px] text-neutral-400"><span>{redaction.summary.approved} approved · {redaction.summary.pending} pending</span><span>Original unchanged</span></div></div>}
    >
      {notice && <p role="status" className="shrink-0 border-b border-indigo-100 bg-indigo-50 px-4 py-2 text-[10px] text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200">{notice}</p>}
      {redaction.error && <button type="button" onClick={redaction.clearError} className="shrink-0 border-b border-red-100 bg-red-50 px-4 py-2 text-left text-[10px] text-red-700">{redaction.error}</button>}
      <div className="grid shrink-0 grid-cols-3 border-b border-neutral-200 px-3 dark:border-neutral-800" role="tablist" aria-label="Redaction views">{(['detect', 'review', 'preview'] as RedactionView[]).map((item) => <button key={item} type="button" role="tab" aria-selected={view === item} onClick={() => setView(item)} className={`h-9 border-b-2 text-[10px] font-semibold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500/35 ${view === item ? 'border-red-600 text-red-700 dark:text-red-300' : 'border-transparent text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>{item}{item === 'review' && redaction.summary.pending > 0 ? ` (${redaction.summary.pending})` : ''}</button>)}</div>
      {view === 'detect' ? <><div className="flex shrink-0 items-center gap-2 border-b border-neutral-200 px-4 py-2.5 dark:border-neutral-800"><button type="button" onClick={() => void addManualSelection()} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 px-3 text-[10px] font-semibold text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"><MousePointer2 size={12} aria-hidden />Use selection</button><span className="ml-auto text-[9px] tabular-nums text-neutral-400">{detection.detections.length} found</span></div><ClassificationLegend /><DetectionFilters value={filter} types={types} onChange={setFilter} /><div className="min-h-0 flex-1 overflow-y-auto">{detection.isDetecting && !detection.detections.length ? <div className="flex h-full flex-col items-center justify-center px-6 text-center" role="status"><LoaderCircle size={23} className="animate-spin text-red-600" aria-hidden /><p className="mt-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200">{detection.progress.message}</p><div className="mt-3 h-1 w-40 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"><div className="h-full bg-red-600 transition-[width]" style={{ width: `${detection.progress.progress}%` }} /></div><button type="button" onClick={detection.cancel} className="mt-4 text-[10px] font-semibold text-neutral-500 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35">Cancel scan</button></div> : detection.error ? <div className="px-6 py-12 text-center"><p role="alert" className="text-xs text-red-700">{detection.error}</p><button type="button" onClick={() => void detection.scan(true)} className="mt-3 text-[10px] font-semibold text-indigo-700">Try again</button></div> : <DetectionResults detections={visibleDetections} protectedRanges={protectedRanges} selectedId={selectedDetectionId} onSelect={(finding) => { setSelectedDetectionId(finding.id); jump(finding) }} onAdd={(finding) => void addFinding(finding)} />}</div></> : view === 'review' ? <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[11rem_1fr]"><div className="max-h-40 overflow-y-auto border-b border-neutral-200 dark:border-neutral-800 md:max-h-none md:border-b-0 md:border-r"><SensitiveDataSidebar records={redaction.records} selectedId={selectedRecordId} onSelect={(record) => { setSelectedRecordId(record.id); jump(record.detection) }} /></div><div className="min-h-0 overflow-y-auto">{selectedRecord ? <><div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-3 py-1.5 dark:border-neutral-800 dark:bg-neutral-900"><button type="button" onClick={() => navigateRecord(-1)} disabled={redaction.records.length < 2} aria-label="Previous redaction" className="flex h-7 w-7 items-center justify-center rounded text-neutral-500 hover:bg-white disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><ChevronLeft size={14} aria-hidden /></button><span className="text-[9px] tabular-nums text-neutral-400">{redaction.records.findIndex((record) => record.id === selectedRecord.id) + 1} of {redaction.records.length}</span><button type="button" onClick={() => navigateRecord(1)} disabled={redaction.records.length < 2} aria-label="Next redaction" className="flex h-7 w-7 items-center justify-center rounded text-neutral-500 hover:bg-white disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><ChevronRight size={14} aria-hidden /></button></div><RedactionReview record={selectedRecord} onStyle={(style) => redaction.setStyle(selectedRecord.id, style)} onClassification={(level) => redaction.setClassification(selectedRecord.id, level)} onDecision={(decision) => { if (decision === 'restored') setRestoreRecord(selectedRecord); else redaction.decide(selectedRecord.id, decision) }} onComment={(text) => redaction.addComment(selectedRecord.id, text)} /></> : <p className="px-6 py-14 text-center text-[10px] text-neutral-400">Choose a finding to review its replacement and classification.</p>}</div></div> : <div className="min-h-0 flex-1 overflow-y-auto"><RedactionPreview text={api?.getDocumentText() ?? ''} records={redaction.records} /></div>}
      <RestoreDialog record={restoreRecord} onClose={() => setRestoreRecord(null)} onConfirm={() => { if (restoreRecord) redaction.decide(restoreRecord.id, 'restored'); setRestoreRecord(null); setNotice('Original visibility restored for future exports.') }} />
    </PanelShell>
  )
}
