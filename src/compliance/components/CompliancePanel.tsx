import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, RefreshCw, ShieldCheck, X } from 'lucide-react'
import type { EditorApi } from '../../lib/editor-api'
import type { InternalDocumentEditorEvents } from '../../sdk/events'
import { useCompliance } from '../hooks/useCompliance'
import { exportComplianceReport } from '../services/recommendationEngine'
import type {
  ComplianceFinding,
  ComplianceRecommendation,
  ComplianceSeverityFilter,
} from '../types/compliance'
import { AnalysisProgress } from './AnalysisProgress'
import { ClauseViewer } from './ClauseViewer'
import { ComplianceSummary } from './ComplianceSummary'
import { RecommendationCard } from './RecommendationCard'
import { RiskSidebar } from './RiskSidebar'

interface CompliancePanelProps {
  isOpen: boolean
  api: EditorApi | null
  aiEndpoint?: string
  events: InternalDocumentEditorEvents
  onClose: () => void
  onJump: (finding: ComplianceFinding) => boolean
  onCreateComment: (finding: ComplianceFinding) => boolean
  onCreateSuggestion: (
    finding: ComplianceFinding,
    recommendation?: ComplianceRecommendation,
  ) => boolean
  onAskAI: (finding: ComplianceFinding) => void
}

export function CompliancePanel({
  isOpen,
  api,
  aiEndpoint,
  events,
  onClose,
  onJump,
  onCreateComment,
  onCreateSuggestion,
  onAskAI,
}: CompliancePanelProps) {
  const panelRef = useRef<HTMLElement>(null)
  const [filter, setFilter] = useState<ComplianceSeverityFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const { report, progress, error, isAnalyzing, analyze, cancel } = useCompliance({ api, active: isOpen, aiEndpoint, events })
  const visibleFindings = useMemo(() => report?.findings.filter((finding) => filter === 'all' || finding.severity === filter) ?? [], [filter, report])
  const selected = report?.findings.find((finding) => finding.id === selectedId) ?? null
  const recommendation = selected
    ? report?.recommendations.find((item) => item.findingId === selected.id)
    : undefined
  const selectedIndex = selected ? visibleFindings.findIndex((finding) => finding.id === selected.id) : -1

  useEffect(() => {
    if (!report?.findings.length) {
      setSelectedId(null)
      return
    }
    setSelectedId((current) => report.findings.some((finding) => finding.id === current) ? current : report.findings[0].id)
  }, [report])

  useEffect(() => {
    if (!isOpen) return
    window.requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>('[aria-label="Close compliance analysis"]')?.focus())
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (isAnalyzing) cancel()
        else onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cancel, isAnalyzing, isOpen, onClose])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(null), 3500)
    return () => window.clearTimeout(timeout)
  }, [notice])

  if (!isOpen) return null

  const navigate = (offset: number) => {
    if (!visibleFindings.length) return
    const next = visibleFindings[(Math.max(0, selectedIndex) + offset + visibleFindings.length) % visibleFindings.length]
    setSelectedId(next.id)
    onJump(next)
  }

  return (
    <>
      <button type="button" aria-label="Close compliance analysis" onClick={onClose} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] lg:hidden" />
      <aside ref={panelRef} id="compliance-panel" role="dialog" aria-modal="true" aria-labelledby="compliance-panel-title" className="compliance-panel fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-hidden border-l border-neutral-200 bg-white shadow-[var(--document-editor-shadow-overlay)] [animation:review-sidebar-in_180ms_ease-out] sm:max-w-[27rem] lg:sticky lg:top-6 lg:z-30 lg:h-[calc(100vh-3rem)] lg:w-[26rem] lg:rounded-lg lg:border">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 px-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-700"><ShieldCheck size={16} aria-hidden /></span>
          <div className="min-w-0"><h2 id="compliance-panel-title" className="truncate text-sm font-semibold text-neutral-950">Compliance Review</h2><p className="truncate text-[10px] text-neutral-500">Advisory risk and quality analysis</p></div>
          <div className="ml-auto flex items-center gap-1">
            {report && <button type="button" onClick={() => exportComplianceReport(report, 'Document')} aria-label="Export compliance report" title="Export report" className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><Download size={14} aria-hidden /></button>}
            <button type="button" onClick={() => void analyze(true)} disabled={isAnalyzing} aria-label="Run compliance analysis again" title="Analyze again" className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><RefreshCw size={14} className={isAnalyzing ? 'animate-spin' : ''} aria-hidden /></button>
            <button type="button" onClick={onClose} aria-label="Close compliance analysis" className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><X size={15} aria-hidden /></button>
          </div>
        </header>

        {notice && <p role="status" className="border-b border-indigo-100 bg-indigo-50 px-4 py-2 text-[10px] text-indigo-800">{notice}</p>}
        {isAnalyzing && !report ? <AnalysisProgress progress={progress} onCancel={cancel} /> : error && !report ? (
          <div className="flex flex-1 flex-col items-center justify-center px-7 text-center"><ShieldCheck size={28} className="text-neutral-300" aria-hidden /><h3 className="mt-3 text-sm font-semibold text-neutral-950">Analysis unavailable</h3><p className="mt-1 text-xs leading-5 text-neutral-500">{error}</p><button type="button" onClick={() => void analyze(true)} className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-neutral-900 px-4 text-[11px] font-semibold text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"><RefreshCw size={13} aria-hidden />Try again</button></div>
        ) : report ? (
          <div className="flex min-h-0 flex-1 flex-col">
            {report.aiNotice && <p role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-[10px] leading-4 text-amber-800">{report.aiNotice}</p>}
            <ComplianceSummary report={report} />
            {selected ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-3 py-1.5">
                  <button type="button" onClick={() => navigate(-1)} disabled={visibleFindings.length < 2} aria-label="Previous finding" className="flex h-7 w-7 items-center justify-center rounded text-neutral-500 hover:bg-white hover:text-neutral-900 disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><ChevronLeft size={14} aria-hidden /></button>
                  <span className="text-[10px] tabular-nums text-neutral-500">{Math.max(1, selectedIndex + 1)} of {visibleFindings.length}</span>
                  <button type="button" onClick={() => navigate(1)} disabled={visibleFindings.length < 2} aria-label="Next finding" className="flex h-7 w-7 items-center justify-center rounded text-neutral-500 hover:bg-white hover:text-neutral-900 disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><ChevronRight size={14} aria-hidden /></button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto"><ClauseViewer finding={selected} onJump={() => { setNotice(onJump(selected) ? 'Finding selected in the document.' : 'The referenced text could not be located.') }} /><RecommendationCard finding={selected} recommendation={recommendation} onCreateComment={() => setNotice(onCreateComment(selected) ? 'Comment created from this finding.' : 'Select a finding with document text to create a comment.')} onCreateSuggestion={() => setNotice(onCreateSuggestion(selected, recommendation) ? 'Tracked suggestion created for review.' : 'A proposed text recommendation is required.')} onAskAI={() => onAskAI(selected)} /></div>
              </div>
            ) : <div className="flex flex-1 items-center justify-center px-6 text-center text-xs text-neutral-500">No findings were detected. The analysis is advisory and does not certify compliance.</div>}
            <RiskSidebar findings={report.findings} selectedId={selectedId} filter={filter} onFilterChange={(next) => { setFilter(next); const first = next === 'all' ? report.findings[0] : report.findings.find((finding) => finding.severity === next); setSelectedId(first?.id ?? null) }} onSelect={(finding) => { setSelectedId(finding.id); onJump(finding) }} />
          </div>
        ) : <AnalysisProgress progress={progress} onCancel={cancel} />}
        <footer className="shrink-0 border-t border-neutral-200 px-4 py-2 text-center text-[9px] text-neutral-400">Advisory analysis only. Not legal certification.</footer>
      </aside>
    </>
  )
}
