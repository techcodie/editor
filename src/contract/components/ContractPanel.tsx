import { useEffect, useRef, useState } from 'react'
import { Download, FileSearch2, History, RefreshCw, Save, X } from 'lucide-react'
import type { ComplianceFinding } from '../../compliance/types/compliance'
import type { EditorApi } from '../../lib/editor-api'
import { useContractAnalysis } from '../hooks/useContractAnalysis'
import { exportContractReport, type ContractReportKind } from '../services/summaryEngine'
import type { ContractClause } from '../types/clause'
import type { ContractAnalysis, ContractObligation, ContractParty, ContractPlaybook, ContractRisk } from '../types/contract'
import type { IdentityAuditInput } from '../../identity/types/identity'
import { AnalysisProgress } from './AnalysisProgress'
import { ClauseComparison } from './ClauseComparison'
import { ClauseList } from './ClauseList'
import { ClauseViewer } from './ClauseViewer'
import { ContractSummary } from './ContractSummary'
import { ObligationTable } from './ObligationTable'
import { PartyViewer } from './PartyViewer'
import { RenewalTimeline } from './RenewalTimeline'
import { RiskDashboard } from './RiskDashboard'

interface ContractPanelProps {
  isOpen: boolean
  api: EditorApi | null
  namespace: string
  author: { id: string; name: string }
  playbook?: ContractPlaybook | null
  complianceFindings?: ComplianceFinding[]
  aiEndpoint?: string
  onClose: () => void
  onAnalysisChange: (analysis: ContractAnalysis | null) => void
  onAudit?: (input: IdentityAuditInput) => void
}

type ContractView = 'overview' | 'clauses' | 'obligations' | 'timeline' | 'risks'

export function ContractPanel(props: ContractPanelProps) {
  const { isOpen, api, namespace, author, playbook, complianceFindings, aiEndpoint, onClose, onAnalysisChange, onAudit } = props
  const panelRef = useRef<HTMLElement>(null)
  const [view, setView] = useState<ContractView>('overview')
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const contract = useContractAnalysis({ api, active: isOpen, namespace, author, playbook, complianceFindings, aiEndpoint, onAnalysisChange, onAudit })
  const analysis = contract.analysis
  const selectedClause = analysis?.clauses.find((item) => item.id === selectedClauseId) ?? null

  useEffect(() => {
    if (!isOpen) return
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>('[aria-label="Close contract intelligence"]')?.focus())
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      const first = focusable[0]; const last = focusable.at(-1)
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const jumpText = (text: string) => {
    const selection = api?.findTextSelection(text)
    if (!selection || !api?.focusTextSelection(selection)) setNotice('This result belongs to an earlier document state. Run analysis again to refresh its location.')
  }
  const jumpClause = (clause: ContractClause) => jumpText(clause.text)
  const jumpObligation = (item: ContractObligation) => {
    const clause = analysis?.clauses.find((candidate) => candidate.id === item.clauseId)
    jumpText(clause?.text ?? item.action)
  }
  const jumpParty = (party: ContractParty) => jumpText(party.name)
  const jumpRisk = (risk: ContractRisk) => {
    const clause = analysis?.clauses.find((candidate) => candidate.id === risk.supportingClauseIds[0])
    if (clause) jumpClause(clause)
  }
  const saveSnapshot = async () => {
    try { await contract.saveSnapshot(); setNotice('Contract analysis saved to version history.') }
    catch (reason) { setNotice(reason instanceof Error ? reason.message : 'The analysis version could not be saved.') }
  }

  return <><button type="button" aria-label="Close contract intelligence" onClick={onClose} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] lg:hidden" /><aside ref={panelRef} id="contract-panel" role="dialog" aria-modal="true" aria-labelledby="contract-panel-title" className="fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-hidden border-l border-neutral-200 bg-white shadow-[var(--document-editor-shadow-overlay)] [animation:review-sidebar-in_180ms_ease-out] dark:border-neutral-800 dark:bg-neutral-950 sm:max-w-[32rem] lg:sticky lg:top-6 lg:z-30 lg:h-[calc(100vh-3rem)] lg:w-[31rem] lg:rounded-lg lg:border"><header className="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200"><FileSearch2 size={16} aria-hidden /></span><div className="min-w-0 flex-1"><h2 id="contract-panel-title" className="truncate text-sm font-semibold text-neutral-950 dark:text-neutral-100">Contract Intelligence</h2><p className="truncate text-[10px] text-neutral-500">Clauses, obligations, dates, and advisory risk</p></div>{analysis && <><button type="button" onClick={() => void saveSnapshot()} aria-label="Save contract analysis to version history" title="Save version" className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 dark:hover:bg-neutral-800"><Save size={14} aria-hidden /></button><label className="relative flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 focus-within:ring-2 focus-within:ring-cyan-500/35 dark:hover:bg-neutral-800" title="Export contract report"><Download size={14} aria-hidden /><span className="sr-only">Export contract report</span><select defaultValue="" onChange={(event) => { if (event.target.value) exportContractReport(analysis, event.target.value as ContractReportKind); event.target.value = '' }} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Export contract report"><option value="" disabled>Export</option><option value="summary">Summary report</option><option value="risks">Risk report</option><option value="clauses">Clause report</option><option value="obligations">Obligation report</option></select></label></>}<button type="button" onClick={() => void contract.run(true)} disabled={contract.isAnalyzing} aria-label="Analyze contract again" title="Analyze again" className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 dark:hover:bg-neutral-800"><RefreshCw size={14} className={contract.isAnalyzing ? 'animate-spin' : ''} aria-hidden /></button><button type="button" onClick={onClose} aria-label="Close contract intelligence" className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 dark:hover:bg-neutral-800"><X size={15} aria-hidden /></button></header>{contract.isAnalyzing && <AnalysisProgress progress={contract.progress} onCancel={contract.cancel} />}{notice && <button type="button" onClick={() => setNotice(null)} className="shrink-0 border-b border-cyan-100 bg-cyan-50 px-4 py-2 text-left text-[9px] text-cyan-900 dark:border-cyan-950 dark:bg-cyan-950/30 dark:text-cyan-200">{notice}</button>}{contract.error && <button type="button" onClick={contract.clearError} role="alert" className="shrink-0 border-b border-red-100 bg-red-50 px-4 py-2 text-left text-[10px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{contract.error}</button>}<nav className="grid shrink-0 grid-cols-5 border-b border-neutral-200 bg-neutral-50 p-1.5 dark:border-neutral-800 dark:bg-neutral-900" aria-label="Contract intelligence views">{(['overview', 'clauses', 'obligations', 'timeline', 'risks'] as ContractView[]).map((item) => <button key={item} type="button" onClick={() => setView(item)} aria-pressed={view === item} className={`h-8 truncate rounded px-1 text-[9px] font-semibold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 ${view === item ? 'bg-white text-neutral-950 shadow-sm dark:bg-neutral-800 dark:text-white' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>{item === 'obligations' ? 'Duties' : item}</button>)}</nav><div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{!analysis && !contract.isAnalyzing ? <div className="flex h-full min-h-72 flex-col items-center justify-center px-7 text-center"><span className="flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900"><FileSearch2 size={19} aria-hidden /></span><h3 className="mt-4 text-sm font-semibold text-neutral-950 dark:text-neutral-100">Analyze this contract</h3><p className="mt-1 max-w-xs text-[10px] leading-5 text-neutral-500">Extract contract structure and surface advisory findings without changing document content.</p><button type="button" onClick={() => void contract.run(true)} className="mt-4 h-9 rounded-md bg-neutral-900 px-4 text-[10px] font-semibold text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 dark:bg-white dark:text-neutral-950">Run analysis</button></div> : analysis && <>{view === 'overview' && <><ContractSummary analysis={analysis} /><div className="border-t border-neutral-200 dark:border-neutral-800"><div className="flex items-center gap-2 px-4 pt-4"><History size={13} className="text-neutral-400" aria-hidden /><h3 className="text-[10px] font-semibold text-neutral-900 dark:text-neutral-100">Change since previous analysis</h3></div><ClauseComparison comparison={contract.comparison} /></div><div className="border-t border-neutral-200 dark:border-neutral-800"><h3 className="px-4 pt-4 text-[10px] font-semibold text-neutral-900 dark:text-neutral-100">Parties</h3><PartyViewer parties={analysis.parties} onJump={jumpParty} /></div></>}{view === 'clauses' && <div className="flex min-h-[32rem] flex-col md:grid md:grid-cols-[12rem_1fr]"><div className="min-h-48 border-b border-neutral-200 dark:border-neutral-800 md:border-b-0 md:border-r"><ClauseList clauses={analysis.clauses} selectedId={selectedClauseId} onSelect={(clause) => setSelectedClauseId(clause.id)} /></div><ClauseViewer clause={selectedClause} onJump={jumpClause} /></div>}{view === 'obligations' && <ObligationTable obligations={analysis.obligations} onJump={jumpObligation} />}{view === 'timeline' && <RenewalTimeline analysis={analysis} onJump={jumpText} />}{view === 'risks' && <RiskDashboard analysis={analysis} onJump={jumpRisk} />}</>}</div><footer className="flex shrink-0 items-center justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-2.5 text-[8px] text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900"><span>{playbook ? `Playbook: ${playbook.name}` : 'No playbook configured'}</span><span>{analysis ? `Updated ${new Date(analysis.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Original unchanged'}</span></footer></aside></>
}
