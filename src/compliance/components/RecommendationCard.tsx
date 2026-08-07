import { Bot, FilePenLine, MessageSquarePlus, Sparkles } from 'lucide-react'
import type { ComplianceFinding, ComplianceRecommendation } from '../types/compliance'

interface RecommendationCardProps {
  finding: ComplianceFinding
  recommendation?: ComplianceRecommendation
  onCreateComment: () => void
  onCreateSuggestion: () => void
  onAskAI: () => void
}

export function RecommendationCard({ finding, recommendation, onCreateComment, onCreateSuggestion, onAskAI }: RecommendationCardProps) {
  const description = recommendation?.description ?? finding.recommendation
  const hasSuggestedText = Boolean(recommendation?.suggestedText ?? finding.suggestedText)
  return (
    <section aria-labelledby="finding-recommendation-title" className="px-4 py-4">
      <div className="flex items-center gap-2"><Sparkles size={14} className="text-indigo-600" aria-hidden /><h3 id="finding-recommendation-title" className="text-xs font-semibold text-neutral-950">Recommendation</h3>{recommendation?.source === 'ai' && <span className="ml-auto rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-700">AI enhanced</span>}</div>
      <p className="mt-2 text-[11px] leading-5 text-neutral-600">{description}</p>
      {(recommendation?.suggestedText ?? finding.suggestedText) && <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-[10px] leading-4 text-neutral-700"><span className="mb-1 block font-semibold text-neutral-500">Proposed text</span>{recommendation?.suggestedText ?? finding.suggestedText}</div>}
      <div className="mt-4 grid grid-cols-3 gap-1.5">
        <button type="button" onClick={onCreateComment} disabled={!finding.location.quote} className="inline-flex h-9 min-w-0 items-center justify-center gap-1 rounded-md border border-neutral-200 bg-white px-1.5 text-[10px] font-semibold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"><MessageSquarePlus size={13} aria-hidden /><span className="truncate">Comment</span></button>
        <button type="button" onClick={onCreateSuggestion} disabled={!hasSuggestedText} className="inline-flex h-9 min-w-0 items-center justify-center gap-1 rounded-md border border-neutral-200 bg-white px-1.5 text-[10px] font-semibold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"><FilePenLine size={13} aria-hidden /><span className="truncate">Suggest</span></button>
        <button type="button" onClick={onAskAI} className="inline-flex h-9 min-w-0 items-center justify-center gap-1 rounded-md bg-neutral-900 px-1.5 text-[10px] font-semibold text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"><Bot size={13} aria-hidden /><span className="truncate">Ask AI</span></button>
      </div>
    </section>
  )
}
