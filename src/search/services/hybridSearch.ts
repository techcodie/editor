import { buildDocumentFrequency, keywordSearch } from './keywordSearch'
import { metadataScore, rankSearchResult } from './rankingEngine'
import { semanticSearch } from './semanticSearch'
import { tokenizeSearchText } from './embeddingEngine'
import type {
  IndexedDocument,
  SearchMode,
  SearchResult,
} from '../types/search'
import type { KnowledgeGraph } from '../types/knowledgeGraph'
import { getRelatedDocuments } from './knowledgeGraph'

function snippetFor(content: string, query: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (normalized.length <= 220) return normalized
  const term = tokenizeSearchText(query)[0]
  const match = term ? normalized.toLocaleLowerCase().indexOf(term) : -1
  const start = Math.max(0, match < 0 ? 0 : match - 72)
  const prefix = start > 0 ? '...' : ''
  const suffix = start + 220 < normalized.length ? '...' : ''
  return `${prefix}${normalized.slice(start, start + 220).trim()}${suffix}`
}

export function runHybridSearch(
  query: string,
  mode: SearchMode,
  documents: IndexedDocument[],
  queryEmbedding: number[],
  graph: KnowledgeGraph,
  relatedDocumentId?: string,
): SearchResult[] {
  const frequency = buildDocumentFrequency(documents)
  const queryTerms = new Set(tokenizeSearchText(query))
  const related = relatedDocumentId
    ? new Map(getRelatedDocuments(graph, relatedDocumentId, documents).map((item) => [item.documentId, item.score]))
    : new Map<string, number>()
  return documents.map((document) => {
    const keyword = keywordSearch(query, document, documents.length, frequency)
    const relationship = related.get(document.id) ?? 0
    const scoreBreakdown = {
      keyword: keyword.score,
      semantic: query ? semanticSearch(queryEmbedding, document.embedding) : 0,
      metadata: metadataScore(document.metadata),
      relationship,
    }
    const relatedDocumentIds = getRelatedDocuments(graph, document.id, documents)
      .slice(0, 5)
      .map((item) => item.documentId)
    return {
      id: `result:${document.id}`,
      documentId: document.id,
      title: document.title,
      snippet: snippetFor(document.content, query),
      score: rankSearchResult(mode, scoreBreakdown),
      scoreBreakdown,
      matchedTopics: document.keywords.filter((topic) => queryTerms.has(topic)).slice(0, 5),
      matchedKnowledgeSources: document.metadata.kind === 'knowledge-source' ? [document.title] : [],
      relatedDocumentIds,
      metadata: document.metadata,
    }
  })
}
