import { useState } from 'react'
import { FileText, LoaderCircle, MousePointer2, RefreshCw, Square } from 'lucide-react'
import type { WritingAnalysis } from '../../writing/types/writing'
import type { WritingSuggestion } from '../../writing/types/suggestion'
import type { GrammarAnalysisScope } from '../hooks/useGrammarProvider'
import { GrammarSuggestionCard } from './GrammarSuggestionCard'

interface GrammarSuggestionsPanelProps {
  analysis: WritingAnalysis | null
  scope: GrammarAnalysisScope
  analyzing: boolean
  progress: number
  error: string | null
  onAnalyze: (scope: GrammarAnalysisScope, force?: boolean) => void
  onCancel: () => void
  onApply: (suggestion: WritingSuggestion) => void
  onComment: (suggestion: WritingSuggestion) => void
}

export function GrammarSuggestionsPanel({ analysis, scope, analyzing, progress, error, onAnalyze, onCancel, onApply, onComment }: GrammarSuggestionsPanelProps) {
  const [dismissed, setDismissed] = useState<string[]>([])
  const suggestions = analysis?.suggestions.filter((item) => !dismissed.includes(item.id)) ?? []
  return (
    <div>
      <div className="border-b border-neutral-200 p-4">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onAnalyze('document')} disabled={analyzing} className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md border text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] ${scope === 'document' ? 'border-neutral-800 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'}`}><FileText size={14} aria-hidden />Document</button>
          <button type="button" onClick={() => onAnalyze('selection')} disabled={analyzing} className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md border text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] ${scope === 'selection' ? 'border-neutral-800 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'}`}><MousePointer2 size={14} aria-hidden />Selection</button>
        </div>
        <div className="mt-2 flex justify-end">
          {analyzing ? <button type="button" onClick={onCancel} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 text-[10px] font-semibold"><Square size={11} fill="currentColor" aria-hidden />Cancel</button> : analysis && <button type="button" onClick={() => onAnalyze(scope, true)} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 text-[10px] font-semibold text-neutral-600 hover:border-neutral-300"><RefreshCw size={12} aria-hidden />Refresh</button>}
        </div>
        {analyzing && <div className="mt-3" role="status"><div className="mb-1 flex items-center justify-between text-[10px] text-neutral-500"><span className="flex items-center gap-1.5"><LoaderCircle size={12} className="animate-spin" aria-hidden />Analyzing writing</span><span>{progress}%</span></div><div className="h-1 overflow-hidden rounded bg-neutral-100"><div className="h-full bg-indigo-500 transition-[width]" style={{ width: `${progress}%` }} /></div></div>}
        {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
      </div>
      {analysis && <div className="grid grid-cols-3 border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-center"><div><p className="text-lg font-semibold text-neutral-900">{analysis.score}</p><p className="text-[9px] uppercase text-neutral-500">Score</p></div><div><p className="text-lg font-semibold text-neutral-900">{analysis.readability.score}</p><p className="text-[9px] uppercase text-neutral-500">Readability</p></div><div><p className="truncate text-sm font-semibold capitalize text-neutral-900">{analysis.tone.primary}</p><p className="text-[9px] uppercase text-neutral-500">Tone</p></div></div>}
      <div className="space-y-2.5 p-4">
        {!analysis && !analyzing && <div className="rounded-md border border-dashed border-neutral-300 px-5 py-10 text-center text-xs text-neutral-500">Choose a scope to check grammar, vocabulary, tone, spelling, and readability.</div>}
        {analysis && suggestions.length === 0 && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-6 text-center text-xs text-emerald-800">No open writing suggestions.</div>}
        {suggestions.map((suggestion) => <GrammarSuggestionCard key={suggestion.id} suggestion={suggestion} onApply={onApply} onComment={onComment} onDismiss={(id) => setDismissed((current) => [...current, id])} />)}
      </div>
    </div>
  )
}
