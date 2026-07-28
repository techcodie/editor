import { detectGrammarIssues } from './grammarEngine'
import { analyzeReadability } from './readabilityEngine'
import { calculateWritingScore } from './scoreEngine'
import { detectSpellingIssues } from './spellingEngine'
import { analyzeStyle } from './styleEngine'
import { createVocabularySuggestions, mergeSuggestions } from './suggestionEngine'
import { analyzeTone } from './toneEngine'
import { documentHash, paragraphs, sentences, words } from './textUtils'
import type { WritingAnalysis, WritingAnalysisProgress } from '../types/writing'

const cache = new Map<string, WritingAnalysis>()
const CACHE_LIMIT = 16

const PROGRESS: Array<WritingAnalysisProgress> = [
  { stage: 'grammar', progress: 18, message: 'Checking grammar and spelling' },
  { stage: 'style', progress: 46, message: 'Evaluating clarity and tone' },
  { stage: 'readability', progress: 72, message: 'Measuring readability' },
  { stage: 'suggestions', progress: 90, message: 'Prioritizing suggestions' },
]

function checkpoint(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Writing analysis was cancelled.', 'AbortError')
}

export async function analyzeWriting(
  text: string,
  options: {
    force?: boolean
    signal?: AbortSignal
    onProgress?: (progress: WritingAnalysisProgress) => void
  } = {},
): Promise<WritingAnalysis> {
  const normalized = text.replaceAll('\r\n', '\n')
  const hash = documentHash(normalized)
  const cached = cache.get(hash)
  if (cached && !options.force) {
    options.onProgress?.({ stage: 'complete', progress: 100, message: 'Analysis ready' })
    return structuredClone(cached)
  }

  options.onProgress?.(PROGRESS[0])
  checkpoint(options.signal)
  const grammar = detectGrammarIssues(normalized)
  const spelling = detectSpellingIssues(normalized)
  await Promise.resolve()

  options.onProgress?.(PROGRESS[1])
  checkpoint(options.signal)
  const suggestions = mergeSuggestions(grammar, spelling)
  const style = analyzeStyle(normalized, suggestions)
  const tone = analyzeTone(normalized)
  await Promise.resolve()

  options.onProgress?.(PROGRESS[2])
  checkpoint(options.signal)
  const readability = analyzeReadability(normalized)
  const allWords = words(normalized)
  await Promise.resolve()

  options.onProgress?.(PROGRESS[3])
  checkpoint(options.signal)
  const vocabulary = createVocabularySuggestions(normalized)
  const { score, breakdown } = calculateWritingScore(suggestions, style, readability, allWords.length)
  const result: WritingAnalysis = {
    id: `analysis-${crypto.randomUUID()}`,
    analyzedAt: Date.now(),
    documentHash: hash,
    wordCount: allWords.length,
    sentenceCount: sentences(normalized).length,
    paragraphCount: paragraphs(normalized).length,
    score,
    scoreBreakdown: breakdown,
    style,
    readability,
    tone,
    suggestions,
    vocabulary,
  }
  cache.set(hash, structuredClone(result))
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string)
  options.onProgress?.({ stage: 'complete', progress: 100, message: 'Analysis complete' })
  return result
}

export function clearWritingAnalysisCache(): void {
  cache.clear()
}
