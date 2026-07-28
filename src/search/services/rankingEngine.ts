import type { SearchDocumentMetadata, SearchMode, SearchScoreBreakdown } from '../types/search'

const MODE_WEIGHTS: Record<SearchMode, SearchScoreBreakdown> = {
  hybrid: { keyword: 0.42, semantic: 0.42, metadata: 0.1, relationship: 0.06 },
  semantic: { keyword: 0.08, semantic: 0.78, metadata: 0.08, relationship: 0.06 },
  keyword: { keyword: 0.8, semantic: 0.08, metadata: 0.08, relationship: 0.04 },
  related: { keyword: 0.05, semantic: 0.25, metadata: 0.05, relationship: 0.65 },
  recent: { keyword: 0.05, semantic: 0.05, metadata: 0.85, relationship: 0.05 },
  'knowledge-sources': { keyword: 0.38, semantic: 0.38, metadata: 0.18, relationship: 0.06 },
}

export function metadataScore(metadata: SearchDocumentMetadata): number {
  const updatedAt = metadata.updatedAt ?? metadata.createdAt
  if (!updatedAt) return metadata.kind === 'current-document' ? 1 : 0.45
  const ageDays = Math.max(0, (Date.now() - updatedAt) / 86_400_000)
  return Math.max(0.1, Math.exp(-ageDays / 90))
}

export function rankSearchResult(
  mode: SearchMode,
  scores: SearchScoreBreakdown,
): number {
  const weights = MODE_WEIGHTS[mode]
  const total =
    scores.keyword * weights.keyword +
    scores.semantic * weights.semantic +
    scores.metadata * weights.metadata +
    scores.relationship * weights.relationship
  return Math.max(0, Math.min(1, total))
}
