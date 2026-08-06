import { useEffect, useState } from 'react'
import { RefreshCw, Save, Sparkles, SpellCheck2 } from 'lucide-react'
import { WRITING_REWRITE_ACTIONS } from '../../../shared/writing'
import type { EditorApi } from '../../lib/editor-api'
import type { InternalDocumentEditorEvents } from '../../sdk/events'
import { PanelShell } from '../../components/ui/PanelShell'
import { useWritingAssistant } from '../hooks/useWritingAssistant'
import type { VocabularySuggestion, WritingSuggestion } from '../types/suggestion'
import type { WritingAnalysis, WritingRewriteAction, WritingRewriteScope } from '../types/writing'
import { AnalysisProgress } from './AnalysisProgress'
import { GrammarSidebar } from './GrammarSidebar'
import { ReadabilityPanel } from './ReadabilityPanel'
import { RewritePreview } from './RewritePreview'
import { ToneIndicator } from './ToneIndicator'
import { VocabularySuggestions } from './VocabularySuggestions'
import { WritingScore } from './WritingScore'

type WritingView = 'overview' | 'suggestions' | 'rewrite'

interface WritingAssistantPanelProps {
  isOpen: boolean
  api: EditorApi | null
  namespace: string
  author: { id: string; name: string }
  aiEndpoint?: string
  events: InternalDocumentEditorEvents
  onClose: () => void
  onAnalysisChange: (analysis: WritingAnalysis | null) => void
  onApply: (originalText: string, suggestedText: string, reason: string) => boolean
  onComment: (suggestion: WritingSuggestion) => boolean
}

export function WritingAssistantPanel(props: WritingAssistantPanelProps) {
  const { isOpen, api, namespace, author, aiEndpoint, events, onClose, onAnalysisChange, onApply, onComment } = props
  const [view, setView] = useState<WritingView>('overview')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rewriteAction, setRewriteAction] = useState<WritingRewriteAction>('improve-clarity')
  const [rewriteScope, setRewriteScope] = useState<WritingRewriteScope>('selection')
  const [selectionAvailable, setSelectionAvailable] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const writing = useWritingAssistant({ api, active: isOpen, namespace, author, aiEndpoint, events, onAnalysisChange })
  const { cancelRewrite, isRewriting, rewrite } = writing

  useEffect(() => {
    if (!api || !isOpen) return
    const update = () => setSelectionAvailable(Boolean(api.getTextSelection()?.text.trim()))
    update()
    return api.subscribe(update)
  }, [api, isOpen])

  useEffect(() => {
    if (!selectionAvailable && rewriteScope === 'selection') setRewriteScope('document')
  }, [rewriteScope, selectionAvailable])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(null), 3200)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const jump = (text: string) => {
    const selection = api?.findTextSelection(text)
    if (!selection || !api?.focusTextSelection(selection)) {
      setNotice('This suggestion belongs to an earlier document state. Analyze again to refresh it.')
      return false
    }
    return true
  }
  const jumpVocabulary = (item: VocabularySuggestion) => jump(item.word)
  const applySuggestion = async (suggestion: WritingSuggestion) => {
    await writing.saveAnalysisSnapshot('Before writing suggestion')
    if (onApply(suggestion.originalText, suggestion.suggestedText, suggestion.reason)) {
      setNotice('The change was added to Suggestion Mode for review.')
    } else setNotice('The text changed. Analyze the document again before applying this suggestion.')
  }
  const applyRewrite = async () => {
    if (!writing.rewrite) return
    await writing.saveAnalysisSnapshot('Before writing rewrite')
    if (onApply(writing.rewrite.originalText, writing.rewrite.rewrittenText, `Writing Assistant: ${writing.rewrite.action.replaceAll('-', ' ')}`)) {
      writing.clearRewrite()
      setNotice('The rewrite was added to Suggestion Mode for review.')
    } else setNotice('The source text changed. Select it again and retry the rewrite.')
  }
  const createComment = (suggestion: WritingSuggestion) => {
    if (onComment(suggestion)) setNotice('A review comment was added to this passage.')
    else setNotice('The passage changed. Analyze again before adding a comment.')
  }
  const saveSnapshot = async () => {
    const saved = await writing.saveAnalysisSnapshot()
    setNotice(saved ? 'Writing analysis saved to version history.' : 'The analysis snapshot could not be saved.')
  }

  const styleMetrics = writing.analysis ? [
    ['Clarity', writing.analysis.style.clarity], ['Conciseness', writing.analysis.style.conciseness],
    ['Professional tone', writing.analysis.style.professionalTone], ['Consistency', writing.analysis.style.consistency],
    ['Sentence variety', writing.analysis.style.sentenceVariety], ['Vocabulary diversity', writing.analysis.style.vocabularyDiversity],
  ] as const : []

  return (
    <PanelShell
      isOpen={isOpen}
      onClose={onClose}
      onEscape={() => { if (rewrite || isRewriting) cancelRewrite(); else onClose() }}
      initialFocusSelector='[aria-label="Close writing assistant"]'
      title="Writing Assistant"
      subtitle="Grammar, style, tone, and readability"
      icon={SpellCheck2}
      iconTone="accent"
      labelledById="writing-assistant-title"
      panelId="writing-assistant-panel"
      widthClassName="sm:max-w-[30rem] lg:w-[29rem]"
      headerActions={<>{writing.analysis && <button type="button" onClick={() => void saveSnapshot()} disabled={writing.isSavingSnapshot} aria-label="Save writing analysis to version history" title="Save analysis" className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 dark:hover:bg-neutral-800"><Save size={14} aria-hidden /></button>}<button type="button" onClick={() => void writing.run(true)} disabled={writing.isAnalyzing} aria-label="Analyze writing again" title="Analyze again" className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 dark:hover:bg-neutral-800"><RefreshCw size={14} className={writing.isAnalyzing ? 'animate-spin' : ''} aria-hidden /></button></>}
      footer={<div className="-mx-4 -my-3 flex items-center justify-between bg-neutral-50 px-4 py-2.5 text-[8px] text-neutral-400 dark:bg-neutral-900"><span>Suggestions are advisory</span><span>{writing.analysis ? `Updated ${new Date(writing.analysis.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Original unchanged'}</span></div>}
    >
      {writing.isAnalyzing && <AnalysisProgress progress={writing.progress} onCancel={writing.cancel} />}
      {notice && <button type="button" onClick={() => setNotice(null)} className="shrink-0 border-b border-violet-100 bg-violet-50 px-4 py-2 text-left text-[9px] text-violet-900 dark:border-violet-950 dark:bg-violet-950/30 dark:text-violet-200">{notice}</button>}
      {writing.error && <button type="button" role="alert" onClick={writing.clearError} className="shrink-0 border-b border-red-100 bg-red-50 px-4 py-2 text-left text-[9px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{writing.error}</button>}
      <nav className="grid shrink-0 grid-cols-3 border-b border-neutral-200 bg-neutral-50 p-1.5 dark:border-neutral-800 dark:bg-neutral-900" aria-label="Writing assistant views">{(['overview', 'suggestions', 'rewrite'] as WritingView[]).map((item) => <button key={item} type="button" onClick={() => setView(item)} aria-pressed={view === item} className={`h-8 rounded text-[9px] font-semibold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 ${view === item ? 'bg-white text-neutral-950 shadow-sm dark:bg-neutral-800 dark:text-white' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>{item}{item === 'suggestions' && writing.openSuggestions.length > 0 ? ` (${writing.openSuggestions.length})` : ''}</button>)}</nav>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{!writing.analysis && !writing.isAnalyzing ? <div className="flex h-full min-h-72 flex-col items-center justify-center px-7 text-center"><span className="flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900"><SpellCheck2 size={19} aria-hidden /></span><h3 className="mt-4 text-sm font-semibold text-neutral-950 dark:text-neutral-100">Review your writing</h3><p className="mt-1 max-w-xs text-[10px] leading-5 text-neutral-500">Analyze grammar, style, tone, and readability without changing the document.</p><button type="button" onClick={() => void writing.run(true)} className="mt-4 h-9 rounded-md bg-neutral-900 px-4 text-[10px] font-semibold text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:bg-white dark:text-neutral-950">Run analysis</button></div> : writing.analysis && <>{view === 'overview' && <><WritingScore analysis={writing.analysis} /><ToneIndicator tone={writing.analysis.tone} /><ReadabilityPanel readability={writing.analysis.readability} /><section className="border-t border-neutral-200 p-4 dark:border-neutral-800"><h3 className="text-[10px] font-semibold text-neutral-900 dark:text-neutral-100">Style signals</h3><div className="mt-3 grid grid-cols-2 gap-2">{styleMetrics.map(([label, value]) => <div key={label} className="rounded-md border border-neutral-200 px-2.5 py-2 dark:border-neutral-800"><div className="flex justify-between text-[8px] text-neutral-500"><span>{label}</span><span className="tabular-nums">{value}</span></div><div className="mt-1.5 h-1 rounded-full bg-neutral-100 dark:bg-neutral-800"><div className="h-full rounded-full bg-violet-600" style={{ width: `${value}%` }} /></div></div>)}</div></section><VocabularySuggestions suggestions={writing.analysis.vocabulary} onJump={jumpVocabulary} /></>}{view === 'suggestions' && <GrammarSidebar suggestions={writing.suggestions} selectedId={selectedId} onSelect={(suggestion) => setSelectedId(suggestion.id)} onJump={(suggestion) => jump(suggestion.originalText)} onApply={(suggestion) => void applySuggestion(suggestion)} onComment={createComment} onDismiss={writing.dismissSuggestion} onRestore={writing.restoreSuggestion} />}{view === 'rewrite' && <div className="p-4"><div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"><div className="flex items-center gap-2"><Sparkles size={13} className="text-violet-600" aria-hidden /><h3 className="text-[10px] font-semibold text-neutral-900 dark:text-neutral-100">Rewrite with context</h3></div><p className="mt-1 text-[9px] leading-4 text-neutral-500">Preview the result first. Applying it creates a tracked suggestion.</p><label className="mt-3 block text-[8px] font-semibold text-neutral-500">Action<select value={rewriteAction} onChange={(event) => setRewriteAction(event.target.value as WritingRewriteAction)} className="mt-1.5 h-9 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-[10px] text-neutral-800 outline-none focus:ring-2 focus:ring-violet-500/30 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">{WRITING_REWRITE_ACTIONS.map((action) => <option key={action.id} value={action.id}>{action.label}</option>)}</select></label><fieldset className="mt-3"><legend className="text-[8px] font-semibold text-neutral-500">Scope</legend><div className="mt-1.5 grid grid-cols-2 rounded-md bg-neutral-100 p-1 dark:bg-neutral-900">{(['selection', 'document'] as WritingRewriteScope[]).map((scope) => <button key={scope} type="button" disabled={scope === 'selection' && !selectionAvailable} onClick={() => setRewriteScope(scope)} aria-pressed={rewriteScope === scope} className={`h-8 rounded text-[9px] font-semibold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 disabled:cursor-not-allowed disabled:opacity-40 ${rewriteScope === scope ? 'bg-white text-neutral-950 shadow-sm dark:bg-neutral-800 dark:text-white' : 'text-neutral-500'}`}>{scope}</button>)}</div></fieldset><button type="button" onClick={() => void writing.startRewrite(rewriteAction, rewriteScope)} disabled={writing.isRewriting} className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-neutral-900 text-[10px] font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:bg-white dark:text-neutral-950"><Sparkles size={13} aria-hidden />Preview rewrite</button></div><RewritePreview result={writing.rewrite} loading={writing.isRewriting} onApply={() => void applyRewrite()} onRetry={() => void writing.startRewrite(rewriteAction, rewriteScope, writing.rewrite?.originalText)} onCancel={writing.cancelRewrite} /></div>}</>}</div>
    </PanelShell>
  )
}
